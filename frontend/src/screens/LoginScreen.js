
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha inválidos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    case "auth/user-disabled":
      return "Esta conta está desativada.";
    default:
      return "Erro ao fazer login.";
  }
}

export default function LoginScreen({
  onLoginSuccess,
  onLoginFuncionario,
  onCadastrar,
  onEsqueciSenha,
}) {
  const [tipoLogin, setTipoLogin] = useState("aluno");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo || !senha) {
      Alert.alert("Atenção", "Preencha o e-mail e a senha.");
      return;
    }

    setCarregando(true);

    try {
      if (tipoLogin === "funcionario") {
        const resposta = await fetch(`${API_URL}/usuarios/funcionario/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: emailLimpo, senha }),
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível entrar como funcionário.");
        onLoginFuncionario?.(dados.token, dados.perfil);
        return;
      }
      const credencial = await signInWithEmailAndPassword(auth, emailLimpo, senha);
      onLoginSuccess?.(credencial.user);
    } catch (error) {
      console.error("Erro Firebase:", error);
      Alert.alert("Erro", error?.code ? mensagemDeErro(error.code) : error.message || "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <StatusBar barStyle="light-content" backgroundColor="#073F31" />
        <View style={styles.container}>
          {/* Elementos decorativos */}
          <View style={styles.circuloSuperior} />
          <View style={styles.circuloLateral} />

          <View style={styles.brand}>
            <Image
              source={require("../../assets/acheinoif-logo.png")}
              style={styles.brandLogo}
              resizeMode="contain"
              accessibilityLabel="Logo AchouNoIF"
            />
            <Text style={styles.brandCaption}>Achados e perdidos do IFPE</Text>
          </View>

          <View style={styles.card}>

            <View style={styles.opcoesAcesso}>
              <TouchableOpacity style={[styles.opcaoAcesso, tipoLogin === "aluno" && styles.opcaoAcessoAtiva]} onPress={() => setTipoLogin("aluno")} disabled={carregando}>
                <Text style={[styles.opcaoAcessoTexto, tipoLogin === "aluno" && styles.opcaoAcessoTextoAtivo]}>Aluno</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.opcaoAcesso, tipoLogin === "funcionario" && styles.opcaoAcessoAtiva]} onPress={() => setTipoLogin("funcionario")} disabled={carregando}>
                <Text style={[styles.opcaoAcessoTexto, tipoLogin === "funcionario" && styles.opcaoAcessoTextoAtivo]}>Funcionário</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.descricao}>
              {tipoLogin === "funcionario" ? "Acesso da equipe para cadastrar itens e analisar solicitações." : "Entre para buscar itens ou acompanhar uma solicitação."}
            </Text>

            {/* Campo de e-mail */}
            <Text style={styles.label}>E-mail</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcone}>✉</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite seu e-mail"
                placeholderTextColor="#9299A8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                editable={!carregando}
                returnKeyType="next"
              />
            </View>

            {/* Campo de senha */}
            <Text style={styles.label}>Senha</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputIcone}>♙</Text>

              <TextInput
                style={styles.input}
                placeholder="Digite sua senha"
                placeholderTextColor="#9299A8"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                value={senha}
                onChangeText={setSenha}
                editable={!carregando}
                onSubmitEditing={fazerLogin}
                returnKeyType="go"
              />
            </View>

            {/* Botão de entrar */}
            <TouchableOpacity
                style={[styles.botaoEntrar, carregando && styles.botaoDesabilitado]}
              onPress={fazerLogin}
              disabled={carregando}
              activeOpacity={0.85}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotaoEntrar}>
                  Entrar
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoCadastro}
              onPress={onCadastrar}
              disabled={carregando}
              activeOpacity={0.85}
            >
              <Text style={styles.textoCadastro}>Criar conta</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoEsqueciSenha}
              onPress={onEsqueciSenha}
              disabled={carregando}
              activeOpacity={0.8}
            >
              <Text style={styles.textoEsqueciSenha}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>
          </View>

          {/* Rodapé */}
          <View style={styles.rodape}>
            <Text style={styles.rodapeSigla}>IFPE</Text>
            <Text style={styles.rodapeTexto}>
              Instituto Federal de Pernambuco
            </Text>
            <Text style={styles.rodapeCampus}>
              Campus Jaboatão
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
    backgroundColor: "#073F31",
  },

  scroll: {
    flexGrow: 1,
  },

  container: {
    flexGrow: 1,
    minHeight: 750,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#073F31",
    paddingHorizontal: 20,
    paddingVertical: 24,
    overflow: "hidden",
  },

  circuloSuperior: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "#087447",
    opacity: 0.4,
    top: -150,
    left: -90,
  },

  circuloLateral: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 2,
    borderColor: "#0A985E",
    opacity: 0.6,
    bottom: 100,
    right: -110,
  },

  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    paddingVertical: 26,
    borderRadius: 26,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },

  brand: {
    alignItems: "center",
    marginBottom: 12,
  },

  brandLogo: {
    width: 218,
    height: 176,
  },

  brandCaption: {
    color: "#D8E9DF",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: -18,
    marginBottom: 9,
  },

  opcoes: {
    flexDirection: "row",
    borderWidth: 1.5,
    borderColor: "#DDE2EB",
    borderRadius: 13,
    padding: 3,
    marginBottom: 14,
  },

  opcoesAcesso: { flexDirection: "row", borderWidth: 1, borderColor: "#DDE2EB", borderRadius: 12, padding: 3, marginBottom: 14 },
  opcaoAcesso: { flex: 1, minHeight: 40, alignItems: "center", justifyContent: "center", borderRadius: 9 },
  opcaoAcessoAtiva: { backgroundColor: "#087447" },
  opcaoAcessoTexto: { color: "#596273", fontSize: 14, fontWeight: "700" },
  opcaoAcessoTextoAtivo: { color: "#fff" },

  opcao: {
    flex: 1,
    minHeight: 54,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 4,
  },

  opcaoUsuarioAtiva: {
    backgroundColor: "#087447",
  },

  opcaoFuncionarioAtiva: {
    backgroundColor: "#15803D",
  },

  iconeOpcao: {
    fontSize: 23,
    color: "#596273",
  },

  textoOpcao: {
    fontSize: 14,
    fontWeight: "700",
    color: "#596273",
  },

  textoOpcaoAtivo: {
    color: "#FFFFFF",
  },

  textoFuncionarioAtivo: {
    color: "#FFFFFF",
  },

  descricao: {
    color: "#737B8B",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 22,
  },

  label: {
    color: "#192743",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 5,
  },

  inputContainer: {
    height: 53,
    borderWidth: 1.5,
    borderColor: "#DDE2EB",
    borderRadius: 11,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 13,
    backgroundColor: "#FFFFFF",
  },

  inputIcone: {
    width: 27,
    fontSize: 21,
    color: "#596273",
  },

  input: {
    flex: 1,
    height: "100%",
    color: "#202B40",
    fontSize: 15,
    paddingHorizontal: 7,
    outlineStyle: "none",
  },

  botaoEntrar: {
    minHeight: 53,
    marginTop: 9,
    borderRadius: 11,
    backgroundColor: "#087447",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },

  botaoEntrarFuncionario: {
    backgroundColor: "#15803D",
  },

  botaoDesabilitado: {
    opacity: 0.65,
  },

  textoBotaoEntrar: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },

  botaoCadastro: {
    minHeight: 50,
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: "#087447",
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },

  textoCadastro: {
    color: "#087447",
    fontSize: 15,
    fontWeight: "700",
  },

  botaoEsqueciSenha: {
    marginTop: 20,
    alignItems: "center",
  },

  textoEsqueciSenha: {
    color: "#087447",
    fontSize: 14,
    fontWeight: "600",
  },

  rodape: {
    alignItems: "center",
    marginTop: 28,
  },

  rodapeSigla: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 3,
  },

  rodapeTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },

  rodapeCampus: {
    color: "#D7F2E2",
    fontSize: 12,
    marginTop: 3,
  },
});
