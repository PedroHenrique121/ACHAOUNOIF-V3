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
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../config/firebase";

function mensagemDeErro(codigo) {
  switch (codigo) {
    case "auth/invalid-email":
      return "Digite um e-mail válido.";
    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Sem conexão com a internet.";
    default:
      return "Erro ao enviar e-mail.";
  }
}

export default function EsqueciSenhaScreen({ onVoltar }) {
  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function recuperarSenha() {
    const emailLimpo = email.trim().toLowerCase();

    if (!emailLimpo) {
      Alert.alert("Atenção", "Digite seu email.");
      return;
    }

    setCarregando(true);

    try {
      await sendPasswordResetEmail(auth, emailLimpo);
      Alert.alert(
        "Link enviado!",
        "Verifique sua caixa de entrada para redefinir sua senha.",
        [{ text: "OK", onPress: onVoltar }]
      );
      setEmail("");
    } catch (error) {
      console.error("Erro ao recuperar senha:", error);
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
            <Text style={styles.titulo}>Recuperar acesso</Text>
            <Text style={styles.ajuda}>Enviaremos um link para redefinir sua senha.</Text>

            <TextInput
              style={styles.input}
              placeholder="Digite seu email"
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
              editable={!carregando}
              onSubmitEditing={recuperarSenha}
            />

            <TouchableOpacity
              style={[styles.botao, carregando && styles.botaoDesabilitado]}
              onPress={recuperarSenha}
              disabled={carregando}
              activeOpacity={0.8}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.textoBotao}>Enviar Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botaoVoltar}
              onPress={onVoltar}
              disabled={carregando}
              activeOpacity={0.8}
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
  ajuda: {
    color: "#718176",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 16,
  },
  input: {
    width: "100%",
    height: 48,
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 10,
    color: "#222",
    backgroundColor: "#F8FBF8",
  },
  botao: {
    width: "100%",
    height: 48,
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
