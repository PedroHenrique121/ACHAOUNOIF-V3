import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { updateProfile } from "firebase/auth";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

export default function PerfilScreen({ user, onVoltar }) {
  const [nome, setNome] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [turma, setTurma] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [indicadores, setIndicadores] = useState({ cadastrados: 0, devolvidos: 0, solicitacoes: 0 });

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const token = await user.getIdToken();
        const resposta = await fetch(`${API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar o perfil.");
        if (ativo) {
          setNome(dados.nome || user.displayName || "");
          setEmail(dados.email || user.email || "");
          setTurma(dados.turma || "");
          try {
            const [resItens, resSolicitacoes] = await Promise.all([
              fetch(`${API_URL}/itens`),
              fetch(`${API_URL}/solicitacoes/minhas`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            const [itens, pedidos] = await Promise.all([
              resItens.json().catch(() => []),
              resSolicitacoes.json().catch(() => []),
            ]);
            if (ativo) setIndicadores({
              cadastrados: (Array.isArray(itens) ? itens : []).filter((item) => Number(item.id_usuario_cadastro) === Number(dados.id_usuario)).length,
              devolvidos: (Array.isArray(itens) ? itens : []).filter((item) => Number(item.id_dono_objeto) === Number(dados.id_usuario)).length,
              solicitacoes: Array.isArray(pedidos) ? pedidos.length : 0,
            });
          } catch (erroIndicadores) {
            console.warn("Não foi possível carregar o resumo do perfil:", erroIndicadores);
          }
        }
      } catch (erro) {
        if (ativo) Alert.alert("Perfil", erro.message);
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [user]);

  async function salvar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo) return Alert.alert("Atenção", "Informe seu nome.");
    setSalvando(true);
    try {
      const token = await user.getIdToken();
      const resposta = await fetch(`${API_URL}/usuarios/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nome: nomeLimpo, turma: turma.trim() }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível salvar o perfil.");
      if (auth.currentUser && user?.uid === auth.currentUser.uid) {
        await updateProfile(user, { displayName: nomeLimpo });
      }
      Alert.alert("Perfil atualizado", "Suas informações foram salvas.", [{ text: "OK", onPress: onVoltar }]);
    } catch (erro) {
      Alert.alert("Erro ao salvar", erro.message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={onVoltar} style={styles.voltar}><Text style={styles.voltarTexto}>‹  Voltar</Text></TouchableOpacity>
        <View style={styles.cartao}>
          <Text style={styles.icone}>♙</Text>
          <Text style={styles.titulo}>Configurações do perfil</Text>
          <Text style={styles.subtitulo}>Mantenha seus dados atualizados.</Text>
          {carregando ? <ActivityIndicator color="#176B45" style={{ margin: 30 }} /> : <>
            <View style={styles.indicadores}>
              <Indicador valor={indicadores.cadastrados} titulo="Itens cadastrados" />
              <Indicador valor={indicadores.devolvidos} titulo="Itens devolvidos" />
              <Indicador valor={indicadores.solicitacoes} titulo="Solicitações" />
            </View>
            <Text style={styles.rotulo}>Nome</Text>
            <TextInput style={styles.input} value={nome} onChangeText={setNome} placeholder="Seu nome" maxLength={100} />
            <Text style={styles.rotulo}>E-mail</Text>
            <TextInput style={[styles.input, styles.desabilitado]} value={email} editable={false} />
            <Text style={styles.ajuda}>O e-mail da conta não pode ser alterado aqui.</Text>
            <Text style={styles.rotulo}>Turma</Text>
            <TextInput style={styles.input} value={turma} onChangeText={setTurma} placeholder="Sua turma" maxLength={50} autoCapitalize="characters" />
            <TouchableOpacity style={[styles.botao, salvando && styles.opaco]} onPress={salvar} disabled={salvando}>
              {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Salvar alterações</Text>}
            </TouchableOpacity>
          </>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Indicador({ valor, titulo }) {
  return <View style={styles.indicador}><Text style={styles.indicadorValor}>{valor}</Text><Text style={styles.indicadorTitulo}>{titulo}</Text></View>;
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#F4F7F5" },
  conteudo: { flexGrow: 1, padding: 18, paddingTop: 46, alignItems: "center" },
  voltar: { width: "100%", maxWidth: 480, marginBottom: 14 },
  voltarTexto: { color: "#176B45", fontSize: 16, fontWeight: "700" },
  cartao: { width: "100%", maxWidth: 480, backgroundColor: "#fff", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: "#E1E8E3" },
  indicadores: { flexDirection: "row", gap: 8, marginBottom: 12 }, indicador: { flex: 1, minHeight: 72, backgroundColor: "#EFF8F2", borderRadius: 11, alignItems: "center", justifyContent: "center", padding: 7 }, indicadorValor: { color: "#087447", fontSize: 20, fontWeight: "800" }, indicadorTitulo: { color: "#59665E", fontSize: 10, textAlign: "center", marginTop: 3 },
  icone: { fontSize: 34, color: "#176B45", textAlign: "center" },
  titulo: { color: "#26352C", fontSize: 22, fontWeight: "800", textAlign: "center", marginTop: 8 },
  subtitulo: { color: "#68766D", textAlign: "center", marginTop: 6, marginBottom: 22 },
  rotulo: { color: "#35443A", fontWeight: "700", marginTop: 12, marginBottom: 6 },
  input: { minHeight: 48, borderWidth: 1, borderColor: "#D7E0DA", borderRadius: 9, paddingHorizontal: 12, color: "#26352C", backgroundColor: "#fff" },
  desabilitado: { backgroundColor: "#F0F2F0", color: "#68766D" },
  ajuda: { color: "#68766D", fontSize: 12, marginTop: 5 },
  botao: { minHeight: 50, borderRadius: 9, backgroundColor: "#176B45", alignItems: "center", justifyContent: "center", marginTop: 24 },
  botaoTexto: { color: "#fff", fontWeight: "700", fontSize: 15 },
  opaco: { opacity: 0.65 },
});
