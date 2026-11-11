import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/email-already-in-use":
      return "Esse e-mail já está em uso.";
    case "auth/weak-password":
      return "Senha muito fraca (mínimo 6 caracteres).";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    case "auth/operation-not-allowed":
      return "O cadastro por e-mail não está habilitado no Firebase.";
    default:
      return "Erro ao cadastrar.";
  }
}

export default function CadastroScreen({ onVoltar }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [turma, setTurma] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const turmaLimpa = turma.trim();

    if (!nomeLimpo || !emailLimpo || !senha) {
      Alert.alert("Atenção", "Preencha nome, e-mail e senha.");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Atenção", "A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);

    try {
      const credencial = await createUserWithEmailAndPassword(
        auth,
        emailLimpo,
        senha
      );

      await updateProfile(credencial.user, {
        displayName: nomeLimpo,
      });

      try {
        const token = await credencial.user.getIdToken();
        const resposta = await fetch(`${API_URL}/usuarios`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nome: nomeLimpo,
            email: emailLimpo,
            turma: turmaLimpa,
          }),
        });

        if (!resposta.ok) {
          const dados = await resposta.json().catch(() => ({}));
          console.warn("Usuário criado no Firebase, mas não sincronizado no MySQL:", dados);
        }
      } catch (erroSincronizacao) {
        console.warn("Falha ao sincronizar usuário com o backend:", erroSincronizacao);
      }

      // O projeto de referência volta para o login após o cadastro.
      await signOut(auth);

      Alert.alert(
        "Conta criada com sucesso!",
        "Agora faça login para entrar no AchouNoIF.",
        [{ text: "OK", onPress: onVoltar }]
      );
    } catch (error) {
      console.error("Erro no cadastro:", error);
      Alert.alert("Erro", mensagemDeErro(error?.code));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" backgroundColor="#073F31" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <Image
            source={require("../../assets/acheinoif-logo.png")}
            style={styles.brandLogo}
            resizeMode="contain"
            accessibilityLabel="Logo AchouNoIF"
          />
          <View style={styles.card}>
            <Text style={styles.titulo}>Crie sua conta</Text>
            <Text style={styles.subtitulo}>Entre para acompanhar os objetos encontrados no IFPE.</Text>
            <Text style={styles.ajuda}>A nova conta terá acesso de aluno. A equipe do sistema libera o acesso de funcionário.</Text>

            <TextInput
              style={styles.input}
              placeholder="Nome Completo"
              placeholderTextColor="#999"
              value={nome}
              onChangeText={setNome}
              editable={!carregando}
              autoCapitalize="words"
            />

            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!carregando}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={senha}
              onChangeText={setSenha}
              editable={!carregando}
            />

            <TextInput
              style={styles.input}
              placeholder="Turma (opcional)"
              placeholderTextColor="#999"
              value={turma}
              onChangeText={setTurma}
              editable={!carregando}
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={cadastrar}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={onVoltar}
              disabled={carregando}
              activeOpacity={0.7}
            >
              <Text style={styles.textoVoltar}>← Voltar para o login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#073F31",
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 6,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    backgroundColor: "#fff",
    padding: 26,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E2ECE5",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
  },
  brandLogo: { width: 150, height: 122 },
  titulo: {
    fontSize: 25,
    fontWeight: "800",
    color: "#183D2C",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitulo: { color: "#718176", textAlign: "center", lineHeight: 19, marginBottom: 18 },
  ajuda: { color: "#64748b", textAlign: "center", lineHeight: 19, marginBottom: 12 },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 8,
    color: "#222",
    backgroundColor: "#F8FBF8",
  },
  botao: {
    width: "100%",
    height: 48,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#176B46",
    justifyContent: "center",
    alignItems: "center",
  },
  botaoDesabilitado: { opacity: 0.65 },
  textoBotao: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  botaoVoltar: { marginTop: 15, alignItems: "center" },
  textoVoltar: { color: "#176B46", fontSize: 14, fontWeight: "600" },
});
