import { Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function HomeFuncionarioScreen({ nome, onAbrirPainel, onCadastrarObjeto, onPerfil, onSair }) {
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#075E3A" barStyle="light-content" />
      <View style={styles.cabecalho}>
        <View style={styles.identidadeMarca}>
          <Image
            source={require("../../assets/acheinoif-simbolo.png")}
            style={styles.simboloMarca}
            resizeMode="contain"
            accessibilityLabel="Logo AchouNoIF"
          />
          <View>
            <Text style={styles.marca}>AchouNoIF</Text>
            <Text style={styles.subtitulo}>Área da equipe do campus</Text>
          </View>
        </View>
      </View>
      <View style={styles.conteudo}>
        <Text style={styles.ola}>Olá, {nome || "funcionário"}</Text>
        <Text style={styles.texto}>Cadastre objetos encontrados e acompanhe os pedidos de devolução enviados pelos alunos.</Text>
        <TouchableOpacity style={styles.primario} onPress={onAbrirPainel}><Text style={styles.primarioTexto}>Abrir painel da equipe</Text></TouchableOpacity>
        <TouchableOpacity style={styles.secundario} onPress={onCadastrarObjeto}><Text style={styles.secundarioTexto}>＋  Cadastrar item encontrado</Text></TouchableOpacity>
        <TouchableOpacity style={styles.link} onPress={onPerfil}><Text style={styles.linkTexto}>Meu perfil</Text></TouchableOpacity>
        <TouchableOpacity style={styles.sair} onPress={onSair}><Text style={styles.sairTexto}>Sair da conta</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F7F5" },
  cabecalho: { backgroundColor: "#104A32", paddingTop: 56, paddingBottom: 28, paddingHorizontal: 22 },
  identidadeMarca: { flexDirection: "row", alignItems: "center" },
  simboloMarca: { width: 50, height: 44, marginRight: 12 },
  marca: { color: "#fff", fontSize: 25, fontWeight: "800" }, subtitulo: { color: "#DDF4E7", marginTop: 4 },
  conteudo: { width: "100%", maxWidth: 580, alignSelf: "center", padding: 20, paddingTop: 36 },
  ola: { color: "#20352A", fontSize: 24, fontWeight: "800" }, texto: { color: "#617067", fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  primario: { minHeight: 54, backgroundColor: "#087447", borderRadius: 12, alignItems: "center", justifyContent: "center" }, primarioTexto: { color: "#fff", fontWeight: "800", fontSize: 16 },
  secundario: { minHeight: 52, borderWidth: 1, borderColor: "#087447", borderRadius: 12, alignItems: "center", justifyContent: "center", marginTop: 12 }, secundarioTexto: { color: "#087447", fontWeight: "700" },
  link: { padding: 14, alignItems: "center", marginTop: 10 }, linkTexto: { color: "#087447", fontWeight: "700" }, sair: { padding: 14, alignItems: "center" }, sairTexto: { color: "#68766D" },
});
