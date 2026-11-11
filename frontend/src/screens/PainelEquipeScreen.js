import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { API_URL } from "../config/api";

const nomeItem = (item) => item.nome_objeto || item.nome || "Objeto";

export default function PainelEquipeScreen({ user, perfil, onSair, onCadastrar, onPerfil, onDetalhe }) {
  const [itens, setItens] = useState([]);
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [aba, setAba] = useState("resumo");
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [processando, setProcessando] = useState(null);

  const carregar = useCallback(async () => {
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [resItens, resSolicitacoes] = await Promise.all([
        fetch(`${API_URL}/itens`),
        fetch(`${API_URL}/solicitacoes`, { headers }),
      ]);
      const [dadosItens, dadosSolicitacoes] = await Promise.all([
        resItens.json().catch(() => []),
        resSolicitacoes.json().catch(() => ({})),
      ]);
      if (!resItens.ok) throw new Error(dadosItens.erro || "Não foi possível carregar os itens.");
      if (!resSolicitacoes.ok) throw new Error(dadosSolicitacoes.erro || "Não foi possível carregar as solicitações.");
      setItens(Array.isArray(dadosItens) ? dadosItens : []);
      setSolicitacoes(Array.isArray(dadosSolicitacoes) ? dadosSolicitacoes : []);
    } catch (erro) {
      Alert.alert("Painel da equipe", erro.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [user]);

  useEffect(() => { carregar(); }, [carregar]);

  async function atualizarSolicitacao(solicitacao, status) {
    setProcessando(solicitacao.id_solicitacao);
    try {
      const token = await user.getIdToken();
      const resposta = await fetch(`${API_URL}/solicitacoes/${solicitacao.id_solicitacao}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível atualizar o pedido.");
      await carregar();
      Alert.alert(status === "aprovada" ? "Pedido aprovado" : "Pedido recusado", status === "aprovada" ? "O item foi marcado como entregue." : "O pedido foi atualizado.");
    } catch (erro) {
      Alert.alert("Solicitação", erro.message);
    } finally {
      setProcessando(null);
    }
  }

  const pendentes = solicitacoes.filter((s) => s.status === "pendente");
  const entregues = itens.filter((i) => i.status_objeto === "entregue").length;
  const categoriaContagem = useMemo(() => {
    const contagem = {};
    itens.forEach((item) => {
      const categoria = item.nome_categoria || "Sem categoria";
      contagem[categoria] = (contagem[categoria] || 0) + 1;
    });
    return Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  }, [itens]);

  if (carregando) return <View style={styles.carregando}><ActivityIndicator size="large" color="#087447" /><Text style={styles.muted}>Carregando painel...</Text></View>;

  return (
    <View style={styles.tela}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onSair} style={styles.voltar}><Text style={styles.voltarTexto}>‹  Sair</Text></TouchableOpacity>
        <View style={styles.headerLinha}><View style={styles.identidadeMarca}><Image source={require("../../assets/acheinoif-simbolo.png")} style={styles.simboloMarca} resizeMode="contain" accessibilityLabel="Logo AchouNoIF" /><View style={styles.titulosHeader}><Text style={styles.titulo}>Painel da equipe</Text><Text style={styles.subtitulo}>{perfil?.nome || "AchouNoIF"}</Text></View></View><TouchableOpacity onPress={onPerfil} style={styles.perfil}><Text style={styles.perfilTexto}>Perfil</Text></TouchableOpacity></View>
      </View>
      <View style={styles.abas}>
        {[ ["resumo", "Resumo"], ["pedidos", `Solicitações (${pendentes.length})`], ["relatorios", "Relatórios"] ].map(([valor, texto]) => (
          <TouchableOpacity key={valor} onPress={() => setAba(valor)} style={[styles.aba, aba === valor && styles.abaAtiva]}><Text style={[styles.abaTexto, aba === valor && styles.abaTextoAtiva]}>{texto}</Text></TouchableOpacity>
        ))}
      </View>
      {aba === "resumo" ? <ScrollView refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} tintColor="#087447" />} contentContainerStyle={styles.conteudo}>
        <View style={styles.gradeKpi}><Kpi titulo="Itens cadastrados" valor={itens.length} /><Kpi titulo="Pedidos pendentes" valor={pendentes.length} destaque /><Kpi titulo="Itens entregues" valor={entregues} /></View>
        <TouchableOpacity style={styles.botaoCadastrar} onPress={onCadastrar}><Text style={styles.botaoCadastrarTexto}>＋  Cadastrar item encontrado</Text></TouchableOpacity>
        <View style={styles.secaoLinha}><Text style={styles.secao}>Solicitações recentes</Text><TouchableOpacity onPress={() => setAba("pedidos")}><Text style={styles.verTudo}>Ver todas</Text></TouchableOpacity></View>
        {pendentes.slice(0, 4).map((s) => <CartaoSolicitacao key={s.id_solicitacao} item={s} busy={processando === s.id_solicitacao} onDecidir={atualizarSolicitacao} />)}
        {!pendentes.length && <Text style={styles.vazio}>Não há solicitações pendentes.</Text>}
        <Text style={styles.secao}>Itens recentes</Text>
        {itens.slice(0, 5).map((item) => <TouchableOpacity key={item.id_objeto} style={styles.linhaItem} onPress={() => onDetalhe(item)}><View style={styles.bolinha}><Text>📦</Text></View><View style={{ flex: 1 }}><Text style={styles.nome}>{nomeItem(item)}</Text><Text style={styles.muted}>{item.local_encontro || "Local não informado"} · {item.nome_categoria || "Sem categoria"}</Text></View><Text style={styles.chevron}>›</Text></TouchableOpacity>)}
      </ScrollView> : null}
      {aba === "pedidos" ? <FlatList data={solicitacoes} keyExtractor={(item) => String(item.id_solicitacao)} refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }} tintColor="#087447" />} contentContainerStyle={styles.conteudo} ListEmptyComponent={<Text style={styles.vazio}>Ainda não há solicitações.</Text>} renderItem={({ item }) => <CartaoSolicitacao item={item} busy={processando === item.id_solicitacao} onDecidir={atualizarSolicitacao} />} /> : null}
      {aba === "relatorios" ? <ScrollView contentContainerStyle={styles.conteudo}><View style={styles.gradeKpi}><Kpi titulo="Total de itens" valor={itens.length} /><Kpi titulo="Devolvidos" valor={entregues} destaque /></View><Text style={styles.secao}>Itens por categoria</Text>{categoriaContagem.map(([nome, quantidade]) => <Barra key={nome} titulo={nome} valor={quantidade} total={itens.length} />)}<Text style={styles.secao}>Estado dos itens</Text><Barra titulo="Disponíveis" valor={itens.length - entregues} total={itens.length} /><Barra titulo="Entregues" valor={entregues} total={itens.length} /></ScrollView> : null}
    </View>
  );
}

function Kpi({ titulo, valor, destaque }) { return <View style={[styles.kpi, destaque && styles.kpiVerde]}><Text style={styles.kpiValor}>{valor}</Text><Text style={styles.kpiTitulo}>{titulo}</Text></View>; }

function Barra({ titulo, valor, total }) {
  const pct = total ? Math.round((valor / total) * 100) : 0;
  return <View style={styles.barraLinha}><View style={styles.barraCabecalho}><Text style={styles.barraTitulo}>{titulo}</Text><Text style={styles.barraValor}>{valor} · {pct}%</Text></View><View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: `${pct}%` }]} /></View></View>;
}

function CartaoSolicitacao({ item, busy, onDecidir }) {
  return <View style={styles.cartaoPedido}>
    <View style={styles.pedidoTitulo}><Text style={styles.nome}>{nomeItem(item)}</Text><Text style={[styles.pedidoStatus, item.status === "pendente" ? styles.statusPendente : styles.statusFechado]}>{item.status}</Text></View>
    <Text style={styles.muted}>{item.nome_usuario || "Aluno"}{item.turma ? ` · ${item.turma}` : ""}</Text>
    <Text style={styles.email}>{item.email_usuario || ""}</Text>
    {item.mensagem ? <Text style={styles.mensagem}>“{item.mensagem}”</Text> : <Text style={styles.muted}>Sem detalhes adicionais do aluno.</Text>}
    {item.status === "pendente" ? <View style={styles.acoesPedido}><TouchableOpacity style={[styles.aprovar, busy && styles.opaco]} onPress={() => onDecidir(item, "aprovada")} disabled={busy}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.acaoTexto}>Aprovar e entregar</Text>}</TouchableOpacity><TouchableOpacity style={styles.recusar} onPress={() => onDecidir(item, "recusada")} disabled={busy}><Text style={styles.recusarTexto}>Recusar</Text></TouchableOpacity></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: "#F4F7F5" }, carregando: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F7F5" }, header: { backgroundColor: "#104A32", paddingHorizontal: 18, paddingTop: 50, paddingBottom: 18 }, voltar: { alignSelf: "flex-start", paddingVertical: 4 }, voltarTexto: { color: "#DDF4E7", fontWeight: "700" }, headerLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, gap: 8 }, identidadeMarca: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center" }, simboloMarca: { width: 44, height: 40, marginRight: 8 }, titulosHeader: { flexShrink: 1 }, titulo: { color: "#fff", fontSize: 21, fontWeight: "800" }, subtitulo: { color: "#DDF4E7", marginTop: 3 }, perfil: { backgroundColor: "#fff", borderRadius: 20, paddingVertical: 9, paddingHorizontal: 14 }, perfilTexto: { color: "#104A32", fontWeight: "700" },
  abas: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderColor: "#E3EAE5" }, aba: { flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3, borderBottomColor: "transparent" }, abaAtiva: { borderBottomColor: "#087447" }, abaTexto: { color: "#68766D", fontWeight: "600", fontSize: 12 }, abaTextoAtiva: { color: "#087447" },
  conteudo: { padding: 16, paddingBottom: 34 }, gradeKpi: { flexDirection: "row", gap: 9 }, kpi: { flex: 1, minHeight: 96, backgroundColor: "#fff", borderRadius: 14, padding: 12, justifyContent: "center", borderWidth: 1, borderColor: "#E3EAE5" }, kpiVerde: { backgroundColor: "#E8F8EE" }, kpiValor: { color: "#163A29", fontSize: 27, fontWeight: "800" }, kpiTitulo: { color: "#607067", fontSize: 11, marginTop: 4 },
  botaoCadastrar: { minHeight: 50, backgroundColor: "#087447", borderRadius: 11, justifyContent: "center", alignItems: "center", marginTop: 14 }, botaoCadastrarTexto: { color: "#fff", fontWeight: "800" }, secaoLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 10 }, secao: { color: "#20352A", fontWeight: "800", fontSize: 17, marginTop: 24, marginBottom: 10 }, verTudo: { color: "#087447", fontWeight: "700" }, vazio: { color: "#68766D", padding: 24, textAlign: "center", backgroundColor: "#fff", borderRadius: 12, marginTop: 6 },
  linhaItem: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 8, gap: 10 }, bolinha: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#E8F3EC" }, nome: { color: "#23372B", fontWeight: "800", fontSize: 15 }, muted: { color: "#6E7B72", fontSize: 12, marginTop: 4 }, chevron: { color: "#087447", fontSize: 25 },
  cartaoPedido: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3EAE5", borderRadius: 14, padding: 15, marginBottom: 10 }, pedidoTitulo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 }, pedidoStatus: { overflow: "hidden", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 13, fontSize: 11, fontWeight: "700", textTransform: "capitalize" }, statusPendente: { backgroundColor: "#FFF1D5", color: "#835400" }, statusFechado: { backgroundColor: "#E8F3EC", color: "#087447" }, email: { color: "#087447", fontSize: 12, marginTop: 3 }, mensagem: { color: "#36483D", lineHeight: 20, marginTop: 10, backgroundColor: "#F5F8F6", padding: 10, borderRadius: 9 }, acoesPedido: { flexDirection: "row", gap: 9, marginTop: 13 }, aprovar: { flex: 1, minHeight: 44, backgroundColor: "#087447", borderRadius: 9, alignItems: "center", justifyContent: "center" }, acaoTexto: { color: "#fff", fontWeight: "700", fontSize: 12 }, recusar: { minHeight: 44, paddingHorizontal: 15, borderRadius: 9, borderWidth: 1, borderColor: "#D5DFD8", alignItems: "center", justifyContent: "center" }, recusarTexto: { color: "#5C6A61", fontWeight: "700" }, opaco: { opacity: 0.6 },
  barraLinha: { marginBottom: 15 }, barraCabecalho: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }, barraTitulo: { color: "#35443A", fontSize: 13 }, barraValor: { color: "#68766D", fontSize: 12 }, barraFundo: { height: 9, borderRadius: 6, backgroundColor: "#E7EEE9", overflow: "hidden" }, barraPreenchida: { height: "100%", borderRadius: 6, backgroundColor: "#087447" },
});
