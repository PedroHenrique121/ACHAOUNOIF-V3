import { useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { API_URL, getFotoUrl } from "../config/api";

const dataCurta = (valor) => {
  if (!valor) return "Não informada";
  const data = new Date(`${String(valor).slice(0, 10)}T12:00:00`);
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString("pt-BR");
};

export default function ItemDetalheScreen({ item, user, onVoltar }) {
  const [mensagem, setMensagem] = useState("");
  const [enviando, setEnviando] = useState(false);
  const status = item?.status_objeto || item?.status;
  const podeSolicitar = !user?.localStaff && status === "perdido" && Number(item?.id_objeto);

  async function solicitar() {
    if (!podeSolicitar) return;
    setEnviando(true);
    try {
      const token = await user.getIdToken();
      const resposta = await fetch(`${API_URL}/solicitacoes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ id_objeto: item.id_objeto, mensagem: mensagem.trim() }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível enviar a solicitação.");
      Alert.alert("Solicitação enviada", "A equipe do campus analisará seu pedido.", [{ text: "OK", onPress: onVoltar }]);
    } catch (erro) {
      Alert.alert("Solicitação", erro.message);
    } finally {
      setEnviando(false);
    }
  }

  if (!item) return null;
  const foto = item.foto_principal ? getFotoUrl(item.foto_principal) : null;
  return (
    <View style={styles.tela}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <TouchableOpacity onPress={onVoltar} style={styles.voltar}><Text style={styles.voltarTexto}>‹  Voltar para a busca</Text></TouchableOpacity>
        {foto ? <Image source={{ uri: foto }} style={styles.foto} resizeMode="cover" /> : <View style={styles.semFoto}><Text style={styles.emoji}>📦</Text><Text style={styles.muted}>Sem foto cadastrada</Text></View>}
        <View style={styles.cartao}>
          <View style={styles.tituloLinha}>
            <Text style={styles.titulo}>{item.nome_objeto || item.nome || "Objeto"}</Text>
            <Text style={[styles.badge, status === "entregue" ? styles.entregue : styles.disponivel]}>{status === "entregue" ? "Entregue" : "Disponível"}</Text>
          </View>
          <Text style={styles.categoria}>{item.nome_categoria || item.categoria || "Sem categoria"}</Text>
          <View style={styles.grade}>
            <Info rotulo="Local encontrado" valor={item.local_encontro} />
            <Info rotulo="Data do encontro" valor={dataCurta(item.data_encontro)} />
            <Info rotulo="Estado do objeto" valor={item.estado_objeto} />
            <Info rotulo="Código" valor={item.codigo_rastreio} />
          </View>
          <Text style={styles.subtitulo}>Descrição</Text>
          <Text style={styles.descricao}>{item.descricao || "Sem descrição informada."}</Text>
          {podeSolicitar ? <>
            <Text style={styles.subtitulo}>Acredita que este item é seu?</Text>
            <Text style={styles.ajuda}>Descreva algum detalhe que ajude a equipe a confirmar a propriedade.</Text>
            <TextInput style={styles.input} value={mensagem} onChangeText={setMensagem} placeholder="Marca, cor ou algo que estava dentro" multiline maxLength={1000} textAlignVertical="top" />
            <TouchableOpacity style={[styles.botao, enviando && styles.opaco]} onPress={solicitar} disabled={enviando}>
              {enviando ? <ActivityIndicator color="#fff" /> : <Text style={styles.botaoTexto}>Enviar solicitação</Text>}
            </TouchableOpacity>
          </> : null}
        </View>
      </ScrollView>
    </View>
  );
}

function Info({ rotulo, valor }) {
  return <View style={styles.info}><Text style={styles.infoRotulo}>{rotulo}</Text><Text style={styles.infoValor}>{valor || "Não informado"}</Text></View>;
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#F4F7F5" }, conteudo: { padding: 16, paddingTop: 44, paddingBottom: 32, alignItems: "center" },
  voltar: { width: "100%", maxWidth: 620, marginBottom: 14 }, voltarTexto: { color: "#087447", fontWeight: "700", fontSize: 16 },
  foto: { width: "100%", maxWidth: 620, height: 270, borderRadius: 16, backgroundColor: "#E8EEE9" }, semFoto: { width: "100%", maxWidth: 620, height: 180, backgroundColor: "#E8EEE9", borderRadius: 16, justifyContent: "center", alignItems: "center" }, emoji: { fontSize: 42 }, muted: { color: "#68766D", marginTop: 6 },
  cartao: { width: "100%", maxWidth: 620, padding: 20, backgroundColor: "#fff", borderRadius: 16, marginTop: 12, borderWidth: 1, borderColor: "#E1E8E3" }, tituloLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, titulo: { flex: 1, fontSize: 23, fontWeight: "800", color: "#20352A" }, badge: { overflow: "hidden", borderRadius: 16, paddingVertical: 6, paddingHorizontal: 10, fontSize: 12, fontWeight: "700" }, disponivel: { color: "#075E37", backgroundColor: "#D7F7E5" }, entregue: { color: "#52615A", backgroundColor: "#E8ECE9" }, categoria: { marginTop: 7, color: "#087447", fontWeight: "700" }, grade: { marginTop: 18, gap: 12 }, info: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#E9EEEA" }, infoRotulo: { color: "#758178", fontSize: 12 }, infoValor: { color: "#27382D", fontSize: 15, fontWeight: "600", marginTop: 3 }, subtitulo: { marginTop: 20, color: "#24382C", fontWeight: "800", fontSize: 16 }, descricao: { color: "#4E5E54", lineHeight: 21, marginTop: 6 }, ajuda: { color: "#68766D", lineHeight: 19, marginTop: 6 }, input: { minHeight: 92, borderWidth: 1, borderColor: "#D7E0DA", borderRadius: 10, padding: 12, marginTop: 12, color: "#26352C" }, botao: { minHeight: 50, borderRadius: 10, backgroundColor: "#087447", alignItems: "center", justifyContent: "center", marginTop: 14 }, botaoTexto: { color: "#fff", fontWeight: "700", fontSize: 15 }, opaco: { opacity: 0.65 },
});
