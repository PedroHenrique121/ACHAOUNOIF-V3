
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  useWindowDimensions,
} from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase";
import { API_URL, getFotoUrl } from "../config/api";

const STATUS = [
  { valor: "todos", texto: "Todos" },
  { valor: "perdido", texto: "Disponíveis" },
  { valor: "entregue", texto: "Entregues" },
];

function normalizarTexto(valor) {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function nomeDoItem(item) {
  return (
    item.nome ??
    item.nome_objeto ??
    item.titulo ??
    item.nomeObjeto ??
    "Objeto sem nome"
  );
}

function descricaoDoItem(item) {
  return (
    item.descricao ??
    item.descricao_objeto ??
    item.descricaoObjeto ??
    ""
  );
}

function categoriaDoItem(item) {
  if (typeof item.categoria === "string") {
    return item.categoria;
  }

  return (
    item.categoria?.nome ??
    item.nome_categoria ??
    item.categoria_nome ??
    "Sem categoria"
  );
}

function textoStatus(status) {
  const valor = normalizarTexto(status);

  if (valor === "perdido" || valor === "perdida") {
    return "Disponível";
  }

  if (
    valor === "entregue" ||
    valor === "encontrado" ||
    valor === "encontrada"
  ) {
    return "Entregue";
  }

  return status || "Sem status";
}

function normalizarStatus(status) {
  const valor = normalizarTexto(status);

  if (["perdido", "perdida"].includes(valor)) {
    return "perdido";
  }

  if (
    ["entregue", "encontrado", "encontrada"].includes(valor)
  ) {
    return "entregue";
  }

  return valor;
}

export default function HomeScreen({ user, onLogout, onConfiguracoes, onAbrirItem }) {
  const { width } = useWindowDimensions();

  const [itens, setItens] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState("Todas");
  const [statusSelecionado, setStatusSelecionado] =
    useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [itemSolicitado, setItemSolicitado] = useState(null);
  const [mensagemSolicitacao, setMensagemSolicitacao] = useState("");
  const [enviandoSolicitacao, setEnviandoSolicitacao] = useState(false);
  const [minhasSolicitacoes, setMinhasSolicitacoes] = useState(null);
  const [carregandoSolicitacoes, setCarregandoSolicitacoes] = useState(false);

  async function abrirMinhasSolicitacoes() {
    setMinhasSolicitacoes([]);
    setCarregandoSolicitacoes(true);
    try {
      const token = await user.getIdToken();
      const resposta = await fetch(`${API_URL}/solicitacoes/minhas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar suas solicitações.");
      setMinhasSolicitacoes(Array.isArray(dados) ? dados : []);
    } catch (erro) {
      Alert.alert("Solicitações", erro.message);
      setMinhasSolicitacoes(null);
    } finally {
      setCarregandoSolicitacoes(false);
    }
  }

  async function enviarSolicitacao() {
    if (!itemSolicitado || !user) return;
    setEnviandoSolicitacao(true);
    try {
      const token = await user.getIdToken();
      const resposta = await fetch(`${API_URL}/solicitacoes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_objeto: itemSolicitado.id_objeto,
          mensagem: mensagemSolicitacao.trim(),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível enviar a solicitação.");
      setItemSolicitado(null);
      setMensagemSolicitacao("");
      Alert.alert("Solicitação enviada", "A equipe responsável analisará seu pedido.");
    } catch (erro) {
      Alert.alert("Não foi possível solicitar", erro.message);
    } finally {
      setEnviandoSolicitacao(false);
    }
  }

  const carregarDados = useCallback(async () => {
    try {
      const [respostaItens, respostaCategorias] =
        await Promise.all([
          fetch(`${API_URL}/itens`),
          fetch(`${API_URL}/categorias`),
        ]);

      if (!respostaItens.ok) {
        throw new Error("Não foi possível carregar os objetos.");
      }

      const dadosItens = await respostaItens.json();
      const listaItens = Array.isArray(dadosItens)
        ? dadosItens
        : [];

      setItens(listaItens);

      if (respostaCategorias.ok) {
        const dadosCategorias = await respostaCategorias.json();

        const nomesCategorias = (
          Array.isArray(dadosCategorias) ? dadosCategorias : []
        )
          .map((categoria) =>
            typeof categoria === "string"
              ? categoria
              : categoria.nome ??
                categoria.nome_categoria ??
                ""
          )
          .filter(Boolean);

        setCategorias(nomesCategorias);
      } else {
        setCategorias([]);
      }
    } catch (erro) {
      console.log("Erro ao carregar objetos:", erro.message);
      setItens([]);
      setCategorias([]);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const atualizarLista = useCallback(() => {
    setAtualizando(true);
    carregarDados();
  }, [carregarDados]);

  const itensFiltrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return itens.filter((item) => {
      const nome = normalizarTexto(nomeDoItem(item));
      const descricao = normalizarTexto(descricaoDoItem(item));
      const categoria = normalizarTexto(categoriaDoItem(item));

      const correspondeBusca =
        !termo ||
        nome.includes(termo) ||
        descricao.includes(termo) ||
        categoria.includes(termo);

      const correspondeCategoria =
        categoriaSelecionada === "Todas" ||
        categoria === normalizarTexto(categoriaSelecionada);

      const correspondeStatus =
        statusSelecionado === "todos" ||
        normalizarStatus(item.status ?? item.status_objeto) === statusSelecionado;

      return (
        correspondeBusca &&
        correspondeCategoria &&
        correspondeStatus
      );
    });
  }, [
    itens,
    busca,
    categoriaSelecionada,
    statusSelecionado,
  ]);

  const sair = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else if (auth.currentUser) {
        await signOut(auth);
      }
    } catch (erro) {
      console.log("Erro ao sair:", erro.message);
    }
  };

  const renderItem = ({ item }) => {
    const foto = item.foto_principal
      ? getFotoUrl(item.foto_principal)
      : null;

    const encontrado =
      normalizarStatus(item.status ?? item.status_objeto) === "entregue";
    const idNumerico = Number(item.id_objeto ?? item.id);

    return (
      <View style={styles.card}>
        <TouchableOpacity onPress={() => onAbrirItem?.(item)} activeOpacity={0.85}>
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={styles.foto}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.semFoto}>
            <Text style={styles.emojiFoto}>📦</Text>
            <Text style={styles.textoSemFoto}>Sem foto</Text>
          </View>
        )}

        <View style={styles.cardConteudo}>
          <Text style={styles.nomeItem}>
            {nomeDoItem(item)}
          </Text>

          <Text style={styles.descricaoItem}>
            {descricaoDoItem(item) ||
              "Sem descrição disponível."}
          </Text>

          <Text style={styles.categoriaItem}>
            {categoriaDoItem(item)}
          </Text>

          <View
            style={[
              styles.statusBadge,
              encontrado
                ? styles.statusEncontrado
                : styles.statusPerdido,
            ]}
          >
            <Text style={styles.statusTexto}>
              {textoStatus(item.status ?? item.status_objeto)}
            </Text>
          </View>
        </View>
        </TouchableOpacity>
        {!encontrado && Number.isInteger(idNumerico) && idNumerico > 0 && (
            <TouchableOpacity
              style={styles.botaoSolicitar}
              onPress={() => setItemSolicitado(item)}
              accessibilityRole="button"
            >
              <Text style={styles.textoBotaoSolicitar}>Solicitar este item</Text>
            </TouchableOpacity>
          )}
      </View>
    );
  };

  if (carregando) {
    return (
      <View style={styles.telaCarregando}>
        <ActivityIndicator size="large" color="#176B45" />
        <Text style={styles.textoCarregando}>
          Carregando objetos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#104A32" />
      <View style={styles.cabecalho}>
        <View style={styles.identidadeMarca}>
          <Image
            source={require("../../assets/acheinoif-simbolo.png")}
            style={styles.simboloMarca}
            resizeMode="contain"
            accessibilityLabel="Logo AchouNoIF"
          />
          <View style={styles.cabecalhoTexto}>
            <Text style={styles.titulo}>AchouNoIF</Text>
            <Text style={styles.subtitulo}>Encontre objetos perdidos no IFPE</Text>
          </View>
        </View>

        <View style={styles.acoesCabecalho}>
          <TouchableOpacity style={styles.botaoCabecalho} onPress={onConfiguracoes} accessibilityRole="button">
            <Text style={styles.textoBotaoCabecalho}>Perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoCabecalho} onPress={abrirMinhasSolicitacoes} accessibilityRole="button">
            <Text style={styles.textoBotaoCabecalho}>Pedidos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSair} onPress={sair} accessibilityRole="button" accessibilityLabel="Sair da conta">
            <Text style={styles.textoBotaoSair}>Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.areaBusca}>
        <TextInput
          style={styles.inputBusca}
          placeholder="Buscar objeto..."
          placeholderTextColor="#777"
          value={busca}
          onChangeText={setBusca}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Buscar objetos"
        />

        {busca.length > 0 && (
          <TouchableOpacity
            style={styles.botaoLimpar}
            onPress={() => setBusca("")}
          >
            <Text style={styles.textoLimpar}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.tituloFiltro}>Categorias</Text>

      {/* Lista horizontal com altura própria para não cortar os botões */}
      <FlatList
        horizontal
        data={[
          "Todas",
          ...categorias.filter(
            (categoria) =>
              normalizarTexto(categoria) !== "todas"
          ),
        ]}
        keyExtractor={(item, index) => `${item}-${index}`}
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled
        style={styles.categoriasLista}
        contentContainerStyle={styles.listaCategorias}
        renderItem={({ item }) => {
          const selecionada =
            categoriaSelecionada === item;

          return (
            <TouchableOpacity
              style={[
                styles.botaoCategoria,
                selecionada && styles.categoriaSelecionada,
              ]}
              onPress={() => setCategoriaSelecionada(item)}
            >
              <Text
                style={[
                  styles.textoCategoria,
                  selecionada &&
                    styles.textoCategoriaSelecionada,
                ]}
                numberOfLines={1}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Modal visible={Boolean(itemSolicitado)} transparent animationType="fade" onRequestClose={() => setItemSolicitado(null)}>
        <View style={styles.fundoModal}>
          <View style={styles.modal}>
            <Text style={styles.tituloModal}>Solicitar item</Text>
            <Text style={styles.descricaoModal}>{itemSolicitado ? nomeDoItem(itemSolicitado) : ""}</Text>
            <Text style={styles.ajudaModal}>Conte algum detalhe que ajude a confirmar que o item é seu (opcional).</Text>
            <TextInput
              style={styles.inputMensagem}
              value={mensagemSolicitacao}
              onChangeText={setMensagemSolicitacao}
              placeholder="Ex.: marca, cor ou algo que estava dentro"
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.botaoEnviar, enviandoSolicitacao && { opacity: 0.65 }]} onPress={enviarSolicitacao} disabled={enviandoSolicitacao}>
              {enviandoSolicitacao ? <ActivityIndicator color="#fff" /> : <Text style={styles.textoBotaoEnviar}>Enviar solicitação</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.botaoCancelar} onPress={() => setItemSolicitado(null)} disabled={enviandoSolicitacao}>
              <Text style={styles.textoCancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={minhasSolicitacoes !== null} transparent animationType="slide" onRequestClose={() => setMinhasSolicitacoes(null)}>
        <View style={styles.fundoModal}>
          <View style={styles.modalLista}>
            <View style={styles.tituloListaModal}>
              <Text style={styles.tituloModal}>Minhas solicitações</Text>
              <TouchableOpacity onPress={() => setMinhasSolicitacoes(null)}><Text style={styles.fecharModal}>Fechar</Text></TouchableOpacity>
            </View>
            {carregandoSolicitacoes ? <ActivityIndicator color="#176B45" style={{ margin: 28 }} /> : (
              <FlatList
                data={minhasSolicitacoes || []}
                keyExtractor={(item) => String(item.id_solicitacao)}
                ListEmptyComponent={<Text style={styles.vazioSolicitacoes}>Você ainda não enviou solicitações.</Text>}
                renderItem={({ item }) => (
                  <View style={styles.linhaSolicitacao}>
                    <Text style={styles.nomeSolicitacao}>{item.nome_objeto || "Item"}</Text>
                    <Text style={styles.statusSolicitacao}>Status: {item.status}</Text>
                    {item.mensagem ? <Text style={styles.mensagemSolicitacao}>{item.mensagem}</Text> : null}
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      <Text style={styles.tituloFiltro}>Status</Text>

      <View style={styles.listaStatus}>
        {STATUS.map((status) => {
          const selecionado =
            statusSelecionado === status.valor;

          return (
            <TouchableOpacity
              key={status.valor}
              style={[
                styles.botaoStatus,
                selecionado && styles.statusSelecionado,
              ]}
              onPress={() =>
                setStatusSelecionado(status.valor)
              }
            >
              <Text
                style={[
                  styles.textoStatusFiltro,
                  selecionado &&
                    styles.textoStatusSelecionado,
                ]}
              >
                {status.texto}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.linhaResultados}>
        <Text style={styles.tituloLista}>
          Objetos disponíveis
        </Text>
        <Text style={styles.contadorResultados}>
          {itensFiltrados.length} resultado(s)
        </Text>
      </View>

      <FlatList
        key={width < 600 ? "lista" : "grade"}
        data={itensFiltrados}
        keyExtractor={(item, index) =>
          String(
            item.id_objeto ??
              item.id ??
              item.id_item ??
              `objeto-${index}`
          )
        }
        renderItem={renderItem}
        numColumns={width < 600 ? 1 : 2}
        columnWrapperStyle={
          width < 600 ? undefined : styles.linhaGrade
        }
        contentContainerStyle={styles.listaObjetos}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarLista}
            colors={["#176B45"]}
          />
        }
        ListEmptyComponent={
          <View style={styles.semResultados}>
            <Text style={styles.emojiVazio}>🔎</Text>
            <Text style={styles.textoVazio}>
              Nenhum objeto encontrado.
            </Text>
            <Text style={styles.dicaVazio}>
              Tente mudar a busca ou os filtros.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F7F5",
    paddingTop: 45,
  },

  telaCarregando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F4F7F5",
  },

  textoCarregando: {
    marginTop: 12,
    fontSize: 15,
    color: "#444",
  },

  cabecalho: {
    backgroundColor: "#104A32",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 18,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
  },

  cabecalhoTexto: {
    flex: 1,
    minWidth: 0,
  },

  identidadeMarca: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    minWidth: 0,
  },

  simboloMarca: {
    width: 44,
    height: 42,
    marginRight: 9,
  },

  titulo: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  subtitulo: {
    marginTop: 4,
    color: "#E2F2E8",
    fontSize: 13,
  },

  botaoSair: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
  },

  textoBotaoSair: {
    color: "#104A32",
    fontWeight: "bold",
  },

  acoesCabecalho: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, marginTop: 14 },
  botaoCabecalho: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#DDEFE4" },
  textoBotaoCabecalho: { color: "#104A32", fontWeight: "bold", fontSize: 12 },
  botaoSolicitar: { minHeight: 42, justifyContent: "center", alignItems: "center", borderRadius: 8, marginTop: 13, backgroundColor: "#176B45" },
  textoBotaoSolicitar: { color: "#fff", fontSize: 14, fontWeight: "700" },
  fundoModal: { flex: 1, backgroundColor: "rgba(15, 30, 20, 0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  modal: { width: "100%", maxWidth: 460, backgroundColor: "#fff", borderRadius: 16, padding: 22 },
  modalLista: { width: "100%", maxWidth: 520, maxHeight: "80%", backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  tituloModal: { fontSize: 21, fontWeight: "800", color: "#26352C" },
  descricaoModal: { color: "#176B45", fontWeight: "700", fontSize: 16, marginTop: 9 },
  ajudaModal: { color: "#68766D", marginTop: 12, lineHeight: 19 },
  inputMensagem: { minHeight: 100, borderWidth: 1, borderColor: "#D7E0DA", borderRadius: 9, padding: 12, marginTop: 12, color: "#26352C" },
  botaoEnviar: { minHeight: 48, backgroundColor: "#176B45", borderRadius: 9, justifyContent: "center", alignItems: "center", marginTop: 16 },
  textoBotaoEnviar: { color: "#fff", fontWeight: "700" },
  botaoCancelar: { padding: 12, alignItems: "center" },
  textoCancelar: { color: "#59665E", fontWeight: "600" },
  tituloListaModal: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  fecharModal: { color: "#176B45", fontWeight: "700" },
  vazioSolicitacoes: { color: "#68766D", textAlign: "center", padding: 28 },
  linhaSolicitacao: { paddingVertical: 13, borderTopWidth: 1, borderTopColor: "#E7ECE8" },
  nomeSolicitacao: { color: "#26352C", fontSize: 15, fontWeight: "700" },
  statusSolicitacao: { color: "#176B45", marginTop: 5, textTransform: "capitalize" },
  mensagemSolicitacao: { color: "#59665E", marginTop: 5 },

  areaBusca: {
    marginHorizontal: 16,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  inputBusca: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderColor: "#D7E0DA",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#222",
  },

  botaoLimpar: {
    marginLeft: 8,
    padding: 8,
  },

  textoLimpar: {
    color: "#176B45",
    fontWeight: "600",
  },

  tituloFiltro: {
    marginTop: 17,
    marginHorizontal: 18,
    marginBottom: 8,
    fontSize: 15,
    fontWeight: "bold",
    color: "#26352C",
  },

  // A lista tem altura própria e não encolhe verticalmente.
  categoriasLista: {
    flexGrow: 0,
    flexShrink: 0,
    height: 48,
  },

  listaCategorias: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    alignItems: "center",
    gap: 8,
  },

  botaoCategoria: {
    flexShrink: 0,
    alignSelf: "center",
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8D6CC",
    backgroundColor: "#FFFFFF",
  },

  categoriaSelecionada: {
    backgroundColor: "#176B45",
    borderColor: "#176B45",
  },

  textoCategoria: {
    color: "#35443A",
    fontSize: 13,
  },

  textoCategoriaSelecionada: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  listaStatus: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
  },

  botaoStatus: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C8D6CC",
    backgroundColor: "#FFFFFF",
  },

  statusSelecionado: {
    backgroundColor: "#DDEFE4",
    borderColor: "#176B45",
  },

  textoStatusFiltro: {
    fontSize: 13,
    color: "#35443A",
  },

  textoStatusSelecionado: {
    color: "#176B45",
    fontWeight: "bold",
  },

  linhaResultados: {
    marginTop: 20,
    marginHorizontal: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  tituloLista: {
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "bold",
    color: "#26352C",
  },

  contadorResultados: {
    fontSize: 12,
    color: "#617067",
  },

  listaObjetos: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },

  linhaGrade: {
    gap: 12,
  },

  card: {
    flex: 1,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1E8E3",
  },

  foto: {
    width: "100%",
    height: 155,
    backgroundColor: "#E8EEE9",
  },

  semFoto: {
    height: 115,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8EEE9",
  },

  emojiFoto: {
    fontSize: 35,
  },

  textoSemFoto: {
    marginTop: 4,
    fontSize: 12,
    color: "#68766D",
  },

  cardConteudo: {
    padding: 14,
  },

  nomeItem: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#26352C",
  },

  descricaoItem: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: "#59665E",
  },

  categoriaItem: {
    marginTop: 10,
    fontSize: 12,
    color: "#176B45",
    fontWeight: "600",
  },

  statusBadge: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },

  statusEncontrado: {
    backgroundColor: "#DDEFE4",
  },

  statusPerdido: {
    backgroundColor: "#FCE8D9",
  },

  statusTexto: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#35443A",
  },

  semResultados: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 45,
  },

  emojiVazio: {
    fontSize: 38,
  },

  textoVazio: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "bold",
    color: "#35443A",
  },

  dicaVazio: {
    marginTop: 6,
    fontSize: 13,
    color: "#68766D",
    textAlign: "center",
  },
});
