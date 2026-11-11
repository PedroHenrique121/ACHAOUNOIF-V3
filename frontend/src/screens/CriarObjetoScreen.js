import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import { auth } from "../config/firebase";
import { API_URL } from "../config/api";

const estados = [
  { valor: "novo", nome: "Novo" },
  { valor: "bom", nome: "Bom" },
  { valor: "danificado", nome: "Danificado" },
  { valor: "quebrado", nome: "Quebrado" },
];

const statusOpcoes = [
  { valor: "perdido", nome: "Disponível para retirada" },
  { valor: "entregue", nome: "Já entregue" },
];

export default function CriarObjetoScreen({ user, navigation, onVoltar }) {
   function voltar() {
    if (onVoltar) {
      onVoltar();
    } else if (navigation?.canGoBack()) {
      navigation.goBack();
    }
  }
  const [nomeObjeto, setNomeObjeto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataEncontro, setDataEncontro] = useState("");
  const [localEncontro, setLocalEncontro] = useState("");
  const [nomeCategoria, setNomeCategoria] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [estadoObjeto, setEstadoObjeto] = useState(null);
  const [statusObjeto, setStatusObjeto] = useState("perdido");
  const [foto, setFoto] = useState(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    let ativo = true;
    fetch(`${API_URL}/categorias`)
      .then(async (resposta) => {
        const dados = await resposta.json().catch(() => []);
        if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar as categorias.");
        if (ativo) setCategorias(Array.isArray(dados) ? dados : []);
      })
      .catch((erro) => {
        if (ativo) Alert.alert("Categorias", erro.message);
      });
    return () => { ativo = false; };
  }, []);

  async function escolherFoto(origem = "galeria") {
    try {
      const permissao = origem === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        Alert.alert(
          "Permissão necessária",
          origem === "camera"
            ? "Permita o acesso à câmera para tirar uma foto."
            : "Permita o acesso às fotos para selecionar uma imagem."
        );
        return;
      }

      const opcoes = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };
      const resultado = origem === "camera"
        ? await ImagePicker.launchCameraAsync(opcoes)
        : await ImagePicker.launchImageLibraryAsync(opcoes);

      if (!resultado.canceled && resultado.assets?.length) {
        const imagem = resultado.assets[0];

        if (imagem.fileSize && imagem.fileSize > 5 * 1024 * 1024) {
          Alert.alert("Imagem muito grande", "Escolha uma imagem de até 5 MB.");
          return;
        }

        setFoto(imagem);
      }
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);
      Alert.alert("Erro", "Não foi possível selecionar a foto.");
    }
  }

  function adicionarFoto() {
    Alert.alert("Foto do item", "Como deseja adicionar a imagem?", [
      { text: "Tirar foto", onPress: () => escolherFoto("camera") },
      { text: "Escolher da galeria", onPress: () => escolherFoto("galeria") },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function cadastrarObjeto() {
    if (
      !nomeObjeto.trim() ||
      !descricao.trim() ||
      !dataEncontro.trim() ||
      !localEncontro.trim() ||
      !nomeCategoria ||
      !estadoObjeto ||
      !statusObjeto
    ) {
      Alert.alert("Atenção", "Preencha todos os campos obrigatórios.");
      return;
    }

    if (categorias.length === 0) {
      Alert.alert("Categorias indisponíveis", "Não foi possível carregar as categorias do sistema. Tente novamente mais tarde.");
      return;
    }

    const usuario = user || auth.currentUser;

    if (!usuario) {
      Alert.alert("Sessão expirada", "Faça login novamente.");
      return;
    }

    setSalvando(true);

    try {
      const token = await usuario.getIdToken();
      const formData = new FormData();

      formData.append("nome_objeto", nomeObjeto.trim());
      formData.append("descricao", descricao.trim());
      formData.append("data_encontro", dataEncontro.trim());
      formData.append("local_encontro", localEncontro.trim());
      formData.append("nome_categoria", nomeCategoria);
      formData.append("estado_objeto", estadoObjeto);
      formData.append("status_objeto", statusObjeto);

      if (foto?.uri) {
        const nomeArquivo = foto.fileName || `foto-${Date.now()}.jpg`;
        const arquivo = new File(foto.uri);
        formData.append("foto", arquivo, nomeArquivo);
      }

      const resposta = await expoFetch(`${API_URL}/itens`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        throw new Error(data.erro || "Não foi possível cadastrar o objeto.");
      }

      Alert.alert(
        "Item salvo!",
        "O objeto foi salvo no banco de dados com sucesso.",
        [{ text: "OK", onPress: voltar }]
      );
    } catch (error) {
      console.error("Erro ao cadastrar objeto:", error);
      Alert.alert("Erro", error.message || "Erro de conexão com o servidor.");
    } finally {
      setSalvando(false);
    }
  }

  return (
  <View style={styles.container}>
    <StatusBar
      barStyle="light-content"
      backgroundColor="#104A32"
    />

    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cabeçalho verde institucional */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.marca}>
            <View style={styles.logo}>
              <Image
                source={require("../../assets/acheinoif-simbolo.png")}
                style={styles.logoImagem}
                resizeMode="contain"
                accessibilityLabel="Logo AchouNoIF"
              />
            </View>

            <View>
              <Text style={styles.nomeApp}>AchouNoIF</Text>
              <Text style={styles.subtituloApp}>
                PORTAL ACADÊMICO
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.headerBotao}
            onPress={voltar}
            disabled={salvando}
          >
            <Text style={styles.headerBotaoTexto}>
              ← Voltar
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroSelo}>
            ACHADOS E PERDIDOS
          </Text>

          <Text style={styles.heroTitulo}>
            Vamos encontrar?
          </Text>

          <Text style={styles.heroDescricao}>
            Cadastre um objeto e ajude a devolvê-lo ao seu dono.
          </Text>

          <Text style={styles.heroRodape}>
            ✦ Comunidade conectada, campus organizado.
          </Text>
        </View>

        <View style={styles.decoracaoCirculo} />
      </View>

      {/* Formulário */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.cardIndicador} />

          <Text style={styles.eyebrow}>NOVO REGISTRO</Text>

          <Text style={styles.titulo}>
            Cadastrar objeto
          </Text>

          <Text style={styles.descricao}>
            Informe os detalhes para facilitar a identificação
            do item.
          </Text>

          {/* Informações */}
          <Text style={styles.secaoTitulo}>
            01. Informações do objeto
          </Text>

          <Text style={styles.label}>Nome do objeto</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Mochila, garrafa, caderno..."
            placeholderTextColor="#9AA99F"
            value={nomeObjeto}
            onChangeText={setNomeObjeto}
            editable={!salvando}
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cor, marca e outras características..."
            placeholderTextColor="#9AA99F"
            multiline
            value={descricao}
            onChangeText={setDescricao}
            editable={!salvando}
          />

          <View style={styles.divisor} />

          {/* Local e data */}
          <Text style={styles.secaoTitulo}>
            02. Local e data
          </Text>

          <Text style={styles.label}>Local</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex.: Biblioteca, pátio, bloco B..."
            placeholderTextColor="#9AA99F"
            value={localEncontro}
            onChangeText={setLocalEncontro}
            editable={!salvando}
          />

          <Text style={styles.label}>Data do ocorrido</Text>
          <TextInput
            style={styles.input}
            placeholder="AAAA-MM-DD"
            placeholderTextColor="#9AA99F"
            value={dataEncontro}
            onChangeText={setDataEncontro}
            editable={!salvando}
            keyboardType="numbers-and-punctuation"
            maxLength={10}
          />

          <Text style={styles.ajuda}>
            Exemplo: 2026-10-20
          </Text>

          <View style={styles.divisor} />

          {/* Categoria */}
          <Text style={styles.secaoTitulo}>
            03. Categoria
          </Text>

          {categorias.length === 0 ? <Text style={styles.ajuda}>Carregando categorias do sistema...</Text> : null}

          <View style={styles.opcoes}>
            {categorias.map((categoria) => {
              const ativo = nomeCategoria === categoria.nome_categoria;

              return (
                <TouchableOpacity
                  key={categoria.nome_categoria}
                  style={[styles.opcao, ativo && styles.opcaoSelecionada]}
                  onPress={() => setNomeCategoria(categoria.nome_categoria)}
                  disabled={salvando}
                >
                  <Text style={styles.icone}>{categoria.icone}</Text>
                  <Text style={[styles.opcaoTexto, ativo && styles.opcaoTextoSelecionado]}>
                    {categoria.nome_categoria}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Estado */}
          <Text style={styles.label}>
            Estado de conservação
          </Text>

          <View style={styles.opcoes}>
            {estados.map((estado) => {
              const ativo = estadoObjeto === estado.valor;

              return (
                <TouchableOpacity
                  key={estado.valor}
                  style={[
                    styles.opcao,
                    ativo && styles.opcaoSelecionada,
                  ]}
                  onPress={() => setEstadoObjeto(estado.valor)}
                  disabled={salvando}
                >
                  <Text
                    style={[
                      styles.opcaoTexto,
                      ativo && styles.opcaoTextoSelecionado,
                    ]}
                  >
                    {estado.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Status */}
          <Text style={styles.label}>Situação do item</Text>

          <View style={styles.opcoes}>
            {statusOpcoes.map((status) => {
              const ativo = statusObjeto === status.valor;

              return (
                <TouchableOpacity
                  key={status.valor}
                  style={[
                    styles.opcao,
                    ativo && styles.opcaoSelecionada,
                  ]}
                  onPress={() => setStatusObjeto(status.valor)}
                  disabled={salvando}
                >
                  <Text
                    style={[
                      styles.opcaoTexto,
                      ativo && styles.opcaoTextoSelecionado,
                    ]}
                  >
                    {status.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.divisor} />

          {/* Foto */}
          <Text style={styles.secaoTitulo}>
            04. Foto do objeto
          </Text>

          <TouchableOpacity
            style={styles.fotoArea}
            onPress={adicionarFoto}
            disabled={salvando}
            activeOpacity={0.8}
          >
            {foto?.uri ? (
              <Image
                source={{ uri: foto.uri }}
                style={styles.fotoPreview}
              />
            ) : (
              <View style={styles.fotoConteudo}>
                <Text style={styles.fotoIcone}>＋</Text>

                <Text style={styles.fotoTexto}>
                  Adicionar foto
                </Text>

                <Text style={styles.fotoSubtexto}>
                  Toque para escolher uma imagem
                </Text>

                <Text style={styles.fotoFormato}>
                  JPG ou PNG • Até 5 MB
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {foto?.uri && (
            <TouchableOpacity
              onPress={() => setFoto(null)}
              disabled={salvando}
              style={styles.removerFotoBotao}
            >
              <Text style={styles.removerFoto}>
                Remover foto
              </Text>
            </TouchableOpacity>
          )}

          {/* Salvar */}
          <TouchableOpacity
            style={[
              styles.botaoSalvar,
              salvando && styles.botaoDesabilitado,
            ]}
            onPress={cadastrarObjeto}
            disabled={salvando}
            activeOpacity={0.85}
          >
            {salvando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.botaoSalvarTexto}>
                Salvar objeto  →
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.notaFinal}>
            Confira os dados antes de concluir o cadastro.
          </Text>
        </View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            EDUCAÇÃO • CONEXÃO • COMUNIDADE
          </Text>
        </View>
      </View>
    </ScrollView>
  </View>
);
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAF2EC",
  },

  scroll: {
    flexGrow: 1,
    paddingBottom: 25,
  },

  // Cabeçalho institucional
  header: {
    backgroundColor: "#104A32",
    paddingTop: Platform.OS === "ios" ? 58 : 42,
    paddingHorizontal: 22,
    paddingBottom: 48,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  marca: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  logo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  logoImagem: { width: 42, height: 38 },

  nomeApp: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.4,
  },

  subtituloApp: {
    color: "#BBDAC7",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    marginTop: 4,
  },

  headerBotao: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 10,
  },

  headerBotaoTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // Apresentação
  hero: {
    marginTop: 34,
    zIndex: 1,
  },

  heroSelo: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(183,225,195,0.13)",
    borderWidth: 1,
    borderColor: "rgba(183,225,195,0.22)",
    borderRadius: 30,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    color: "#BCE3C8",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    overflow: "hidden",
  },

  heroTitulo: {
    color: "#FFFFFF",
    fontSize: 31,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  heroDescricao: {
    color: "#D7E9DC",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 9,
    maxWidth: 320,
  },

  heroRodape: {
    color: "#D7E9DC",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 20,
  },

  decoracaoCirculo: {
    position: "absolute",
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(121,190,145,0.09)",
    borderWidth: 1,
    borderColor: "rgba(191,228,201,0.09)",
    right: -75,
    bottom: -60,
  },

  // Conteúdo principal
  content: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
    paddingHorizontal: 16,
    marginTop: -24,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    padding: 22,
    borderWidth: 1,
    borderColor: "#E0EAE2",
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#194D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
  },

  cardIndicador: {
    width: 44,
    height: 4,
    borderRadius: 5,
    backgroundColor: "#3A9B67",
    marginBottom: 22,
  },

  eyebrow: {
    color: "#288052",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.5,
    marginBottom: 8,
  },

  titulo: {
    color: "#183D2C",
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "900",
    letterSpacing: -0.6,
  },

  descricao: {
    color: "#718176",
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 25,
  },

  // Campos
  secaoTitulo: {
    color: "#183D2C",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
    marginBottom: 17,
  },

  label: {
    color: "#294D3A",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 8,
  },

  input: {
    width: "100%",
    minHeight: 51,
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 14 : 11,
    color: "#183D2C",
    backgroundColor: "#F8FBF8",
    fontSize: 13,
    marginBottom: 12,
  },

  textArea: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  ajuda: {
    color: "#718176",
    fontSize: 11,
    lineHeight: 16,
    marginTop: -5,
    marginBottom: 12,
    marginLeft: 2,
  },

  divisor: {
    height: 1,
    backgroundColor: "#E9F0EA",
    marginTop: 15,
    marginBottom: 24,
  },

  // Categorias, estado e status
  carregandoCategoria: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FBF8",
    borderRadius: 12,
    padding: 15,
    gap: 10,
    marginBottom: 12,
  },

  carregandoTexto: {
    color: "#718176",
    fontSize: 12,
  },

  opcoes: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginBottom: 16,
  },

  opcao: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 12,
    backgroundColor: "#F8FBF8",
    borderWidth: 1,
    borderColor: "#DCE8DF",
    borderRadius: 12,
    maxWidth: "100%",
  },

  opcaoSelecionada: {
    backgroundColor: "#176B46",
    borderColor: "#176B46",
  },

  icone: {
    fontSize: 16,
    marginRight: 2,
  },

  opcaoTexto: {
    color: "#385343",
    fontSize: 12,
    fontWeight: "600",
    flexShrink: 1,
  },

  opcaoTextoSelecionado: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  // Área de foto
  fotoArea: {
    width: "100%",
    minHeight: 205,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#A9CDB5",
    borderRadius: 18,
    backgroundColor: "#F5FAF6",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginTop: 5,
  },

  fotoConteudo: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 12,
  },

  fotoIcone: {
    color: "#176B46",
    fontSize: 36,
    fontWeight: "400",
    marginBottom: 12,
  },

  fotoTexto: {
    color: "#176B46",
    fontSize: 15,
    fontWeight: "800",
  },

  fotoSubtexto: {
    color: "#718176",
    fontSize: 11,
    textAlign: "center",
    marginTop: 7,
  },

  fotoFormato: {
    color: "#52745E",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 13,
    backgroundColor: "#E7F1E9",
    overflow: "hidden",
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 6,
  },

  fotoPreview: {
    width: "100%",
    height: 230,
    resizeMode: "cover",
  },

  removerFotoBotao: {
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  removerFoto: {
    color: "#C24141",
    fontSize: 12,
    fontWeight: "800",
  },

  // Botão de salvar
  botaoSalvar: {
    width: "100%",
    minHeight: 55,
    marginTop: 25,
    borderRadius: 15,
    backgroundColor: "#176B46",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 18,
    elevation: 3,
    shadowColor: "#104A32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 7,
  },

  botaoDesabilitado: {
    backgroundColor: "#8CB6A0",
    elevation: 0,
    shadowOpacity: 0,
  },

  botaoSalvarTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  notaFinal: {
    color: "#718176",
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 14,
  },

  // Rodapé
  rodape: {
    alignItems: "center",
    paddingTop: 25,
    paddingBottom: 10,
  },

  rodapeTexto: {
    color: "#789080",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.3,
    textAlign: "center",
  },
});
