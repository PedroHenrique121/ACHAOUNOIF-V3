import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, View } from "react-native";
import { onAuthStateChanged, signOut } from "firebase/auth";

import { auth } from "./src/config/firebase";
import { API_URL } from "./src/config/api";
import LoginScreen from "./src/screens/LoginScreen";
import CadastroScreen from "./src/screens/CadastroScreen";
import EsqueciSenhaScreen from "./src/screens/EsqueciSenhaScreen";
import HomeScreen from "./src/screens/HomeScreen";
import HomeFuncionarioScreen from "./src/screens/HomeFuncionarioScreen";
import CriarObjetoScreen from "./src/screens/CriarObjetoScreen";
import PerfilScreen from "./src/screens/PerfilScreen";
import ItemDetalheScreen from "./src/screens/ItemDetalheScreen";
import PainelEquipeScreen from "./src/screens/PainelEquipeScreen";

export default function App() {
  const [user, setUser] = useState(undefined);
  const [sessaoFuncionario, setSessaoFuncionario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [tela, setTela] = useState("login");
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [carregandoPerfil, setCarregandoPerfil] = useState(false);
  const usuarioAtivo = sessaoFuncionario || user;

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  useEffect(() => {
    let ativo = true;
    async function carregarPerfil() {
      if (!usuarioAtivo) {
        setPerfil(null);
        setCarregandoPerfil(false);
        return;
      }
      if (usuarioAtivo.localStaff) {
        setPerfil(usuarioAtivo.perfil);
        setCarregandoPerfil(false);
        return;
      }
      setCarregandoPerfil(true);
      try {
        const token = await usuarioAtivo.getIdToken();
        let resposta = await fetch(`${API_URL}/usuarios/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        let dados = await resposta.json().catch(() => ({}));
        if (resposta.status === 404) {
          const nome = usuarioAtivo.displayName || usuarioAtivo.email?.split("@")[0] || "Usuário";
          const cadastro = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ nome, turma: "" }),
          });
          const cadastroDados = await cadastro.json().catch(() => ({}));
          if (!cadastro.ok) throw new Error(cadastroDados.erro || "Não foi possível sincronizar seu perfil.");
          resposta = await fetch(`${API_URL}/usuarios/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          dados = await resposta.json().catch(() => ({}));
        }
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível validar seu perfil.");
        if (ativo) setPerfil(dados);
      } catch (erro) {
        if (!ativo) return;
        Alert.alert("Não foi possível abrir sua conta", erro.message, [
          { text: "OK", onPress: () => signOut(auth) },
        ]);
      } finally {
        if (ativo) setCarregandoPerfil(false);
      }
    }
    carregarPerfil();
    return () => { ativo = false; };
  }, [usuarioAtivo]);

  async function fazerLogout() {
    if (sessaoFuncionario) {
      setSessaoFuncionario(null);
      setPerfil(null);
      setTela("login");
      setItemSelecionado(null);
      return;
    }
    try {
      await signOut(auth);
      setTela("login");
      setItemSelecionado(null);
    } catch (erro) {
      console.error("Erro ao sair:", erro);
      Alert.alert("Erro", "Não foi possível sair da conta.");
    }
  }

  if ((!sessaoFuncionario && user === undefined) || carregandoPerfil) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color="#087447" />
      </View>
    );
  }

  if (usuarioAtivo && perfil) {
    const equipe = ["funcionario", "admin"].includes(perfil.tipo_usuario);
    if (tela === "perfil") {
      return <PerfilScreen user={usuarioAtivo} onVoltar={() => setTela(equipe ? "painel" : "home")} />;
    }
    if (tela === "criarObjeto") {
      return <CriarObjetoScreen user={usuarioAtivo} onVoltar={() => setTela(equipe ? "painel" : "home")} />;
    }
    if (tela === "detalhe") {
      return <ItemDetalheScreen item={itemSelecionado} user={usuarioAtivo} onVoltar={() => setTela(equipe ? "painel" : "home")} />;
    }
    if (equipe && tela === "painel") {
      return (
        <PainelEquipeScreen
          user={usuarioAtivo}
          perfil={perfil}
          onSair={fazerLogout}
          onCadastrar={() => setTela("criarObjeto")}
          onPerfil={() => setTela("perfil")}
          onDetalhe={(item) => { setItemSelecionado(item); setTela("detalhe"); }}
        />
      );
    }
    if (equipe) {
      return (
        <HomeFuncionarioScreen
          nome={perfil.nome}
          onAbrirPainel={() => setTela("painel")}
          onCadastrarObjeto={() => setTela("criarObjeto")}
          onPerfil={() => setTela("perfil")}
          onSair={fazerLogout}
        />
      );
    }
    return (
      <HomeScreen
        user={usuarioAtivo}
        onLogout={fazerLogout}
        onConfiguracoes={() => setTela("perfil")}
        onAbrirItem={(item) => { setItemSelecionado(item); setTela("detalhe"); }}
      />
    );
  }

  if (tela === "cadastro") {
    return <CadastroScreen onVoltar={() => setTela("login")} onCadastroSucesso={() => setTela("login")} />;
  }
  if (tela === "esqueciSenha") {
    return <EsqueciSenhaScreen onVoltar={() => setTela("login")} />;
  }
  return (
    <LoginScreen
      onLoginSuccess={() => setTela("home")}
      onLoginFuncionario={(token, perfilFuncionario) => {
        setSessaoFuncionario({
          email: perfilFuncionario.email,
          displayName: perfilFuncionario.nome,
          localStaff: true,
          perfil: perfilFuncionario,
          getIdToken: async () => token,
        });
        setPerfil(perfilFuncionario);
        setTela("painel");
      }}
      onCadastrar={() => setTela("cadastro")}
      onEsqueciSenha={() => setTela("esqueciSenha")}
    />
  );
}

const styles = StyleSheet.create({
  carregando: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
});
