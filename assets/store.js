// Dados compartilhados pelas três demos (site, chatbot e painel).
// Tudo fica no localStorage do navegador: o que se agenda no site ou no
// chatbot aparece no painel. Clínica, profissionais e pacientes são fictícios.
const DemoStore = (() => {
  const KEY = 'demoClinica.v1';

  const CLINICA = {
    nome: 'Clínica Aurora',
    subtitulo: 'Odontologia & Estética',
    endereco: 'Av. Exemplo, 1000, sala 12, Centro (endereço fictício)',
    horarioTxt: 'Seg. a sex., das 8h às 19h · Sáb., das 8h às 13h',
    whatsapp: '(11) 90000-0000',
  };

  const SERVICOS = [
    { id: 'avaliacao', nome: 'Avaliação', area: 'Odontologia', duracao: 30, preco: 0, precoTxt: 'Gratuita' },
    { id: 'limpeza', nome: 'Limpeza e profilaxia', area: 'Odontologia', duracao: 30, preco: 180 },
    { id: 'clareamento', nome: 'Clareamento dental', area: 'Estética dental', duracao: 60, preco: 900 },
    { id: 'lentes', nome: 'Lentes de contato dental', area: 'Estética dental', duracao: 60, preco: null, precoTxt: 'Sob avaliação' },
    { id: 'botox', nome: 'Toxina botulínica', area: 'Harmonização', duracao: 30, preco: 1200 },
    { id: 'preenchimento', nome: 'Preenchimento labial', area: 'Harmonização', duracao: 60, preco: 1500 },
    { id: 'pele', nome: 'Limpeza de pele profunda', area: 'Estética facial', duracao: 60, preco: 250 },
  ];

  const PROFISSIONAIS = [
    { id: 'marina', nome: 'Dra. Marina Alves', esp: 'Dentista · estética dental', areas: ['Odontologia', 'Estética dental'] },
    { id: 'rafael', nome: 'Dr. Rafael Costa', esp: 'Harmonização orofacial', areas: ['Harmonização'] },
    { id: 'julia', nome: 'Júlia Prado', esp: 'Esteticista', areas: ['Estética facial'] },
  ];

  const STATUS = {
    pendente: 'Aguardando confirmação',
    confirmado: 'Confirmado',
    concluido: 'Concluído',
    faltou: 'Faltou',
    cancelado: 'Cancelado',
  };

  const ETAPAS_ORCAMENTO = {
    enviado: 'Enviado',
    negociacao: 'Em negociação',
    aprovado: 'Aprovado',
    perdido: 'Perdido',
  };

  const ORIGENS = { site: 'Site', whatsapp: 'WhatsApp', telefone: 'Telefone', recepcao: 'Recepção' };

  // ---------- datas ----------
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const hoje = () => iso(new Date());
  const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  const fmtData = (s) => { const d = parseISO(s); return `${DIAS[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const fmtCurta = (s) => { const d = parseISO(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`; };
  const diasEntre = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
  const brl = (v) => v == null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  const toMin = (h) => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
  const toHora = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

  // Expediente em minutos: [abertura, fechamento]; domingo fechado.
  const expediente = (dataISO) => {
    const dia = parseISO(dataISO).getDay();
    if (dia === 0) return null;
    if (dia === 6) return [8 * 60, 13 * 60];
    return [8 * 60, 19 * 60];
  };

  // ---------- dados de exemplo ----------
  function seed() {
    let s = 42;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];

    const nomes = ['Ana Ribeiro', 'Bruno Martins', 'Carla Souza', 'Diego Lima', 'Elisa Fernandes', 'Fábio Rocha',
      'Gabriela Nunes', 'Henrique Dias', 'Isabela Moura', 'João Pereira', 'Larissa Castro', 'Marcos Teixeira',
      'Natália Freitas', 'Otávio Barros', 'Paula Mendes', 'Renata Cardoso'];
    const pacientes = nomes.map((nome, i) => ({
      id: 'p' + (i + 1), nome, tel: `(11) 9${pad(10 + i)}00-00${pad(i)}`, criadoEm: iso(addDays(new Date(), -60 + i)),
    }));

    const data = {
      pacientes, agendamentos: [], orcamentos: [], atividade: [], seq: 1,
    };

    const base = new Date();
    for (let off = -14; off <= 7; off++) {
      const dISO = iso(addDays(base, off));
      const exp = expediente(dISO);
      if (!exp) continue;
      const qtd = 3 + Math.floor(rnd() * 4);
      for (let k = 0; k < qtd; k++) {
        const sv = pick(SERVICOS);
        const pro = PROFISSIONAIS.find((p) => p.areas.includes(sv.area));
        const livres = slotsLivres(data, dISO, sv.id, true).filter((x) => x.proId === pro.id);
        if (!livres.length) continue;
        const slot = pick(livres);
        let status;
        if (off < 0) status = rnd() < 0.85 ? 'concluido' : 'faltou';
        else if (off === 0) status = rnd() < 0.7 ? 'confirmado' : 'pendente';
        else status = rnd() < 0.5 ? 'confirmado' : 'pendente';
        data.agendamentos.push({
          id: data.seq++, pacienteId: pick(pacientes).id, servicoId: sv.id, proId: pro.id,
          data: dISO, hora: slot.hora, status, origem: pick(['site', 'whatsapp', 'whatsapp', 'telefone', 'recepcao']),
          criadoEm: iso(addDays(base, off - 3)),
        });
      }
    }

    const orc = [
      ['p2', 'Lentes de contato dental (8 dentes)', 9600, 'negociacao', -9],
      ['p5', 'Clareamento + limpeza', 1080, 'enviado', -6],
      ['p7', 'Harmonização: preenchimento + toxina', 2700, 'enviado', -12],
      ['p9', 'Implante unitário', 4200, 'negociacao', -3],
      ['p11', 'Clareamento dental', 900, 'aprovado', -15],
      ['p13', 'Lentes de contato dental (6 dentes)', 7200, 'perdido', -25],
      ['p4', 'Limpeza de pele (pacote com 4)', 880, 'enviado', -2],
      ['p15', 'Toxina botulínica', 1200, 'negociacao', -7],
    ];
    data.orcamentos = orc.map(([pacienteId, descricao, valor, etapa, off], i) => ({
      id: i + 1, pacienteId, descricao, valor, etapa, enviadoEm: iso(addDays(base, off)), ultimoContato: iso(addDays(base, off)),
    }));

    data.atividade.push({ quando: new Date().toISOString(), origem: 'sistema', texto: 'Dados de exemplo carregados' });
    return data;
  }

  // ---------- persistência ----------
  let cache = null;
  function load() {
    if (cache) return cache;
    try { cache = JSON.parse(localStorage.getItem(KEY)); } catch (e) { cache = null; }
    if (!cache || !cache.agendamentos) { cache = seed(); save(); }
    return cache;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* sem storage: segue em memória */ }
  }
  function reset() { cache = seed(); save(); return cache; }

  // Outra aba (ex.: o chatbot) mudou os dados: recarrega.
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) { cache = null; document.dispatchEvent(new CustomEvent('demo:changed')); }
  });

  // ---------- agenda ----------
  function slotsLivres(data, dataISO, servicoId, ignorarAgora = false) {
    const exp = expediente(dataISO);
    const sv = SERVICOS.find((s) => s.id === servicoId);
    if (!exp || !sv) return [];
    const pros = PROFISSIONAIS.filter((p) => p.areas.includes(sv.area));
    const agoraMin = dataISO === hoje() && !ignorarAgora ? new Date().getHours() * 60 + new Date().getMinutes() + 30 : -1;
    const out = [];
    for (let m = exp[0]; m + sv.duracao <= exp[1]; m += 30) {
      if (m < agoraMin) continue;
      for (const p of pros) {
        const ocupado = data.agendamentos.some((a) => {
          if (a.data !== dataISO || a.proId !== p.id || a.status === 'cancelado') return false;
          const ini = toMin(a.hora);
          const fim = ini + SERVICOS.find((s) => s.id === a.servicoId).duracao;
          return m < fim && ini < m + sv.duracao;
        });
        if (!ocupado) { out.push({ hora: toHora(m), proId: p.id }); break; }
      }
    }
    return out;
  }

  function proximosDiasAbertos(n) {
    const out = [];
    for (let i = 0; out.length < n && i < 14; i++) {
      const d = iso(addDays(new Date(), i));
      const exp = expediente(d);
      // Hoje só entra se ainda sobra expediente.
      const agora = new Date().getHours() * 60 + new Date().getMinutes();
      if (exp && !(i === 0 && agora + 60 > exp[1])) out.push(d);
    }
    return out;
  }

  function pacientePorTel(nome, tel) {
    const d = load();
    const limpo = tel.replace(/\D/g, '');
    let p = d.pacientes.find((x) => x.tel.replace(/\D/g, '') === limpo);
    if (!p) {
      p = { id: 'p' + (d.pacientes.length + 1) + '-' + Date.now().toString(36), nome, tel, criadoEm: hoje() };
      d.pacientes.push(p);
    }
    return p;
  }

  function registrar(origem, texto) {
    const d = load();
    d.atividade.unshift({ quando: new Date().toISOString(), origem, texto });
    d.atividade = d.atividade.slice(0, 50);
  }

  function agendar({ nome, tel, servicoId, data, hora, origem, status = 'pendente' }) {
    const d = load();
    const livre = slotsLivres(d, data, servicoId).find((s) => s.hora === hora);
    if (!livre) throw new Error('Esse horário acabou de ser ocupado. Escolha outro.');
    const p = pacientePorTel(nome, tel);
    const ag = { id: d.seq++, pacienteId: p.id, servicoId, proId: livre.proId, data, hora, status, origem, criadoEm: hoje() };
    d.agendamentos.push(ag);
    registrar(origem, `${p.nome} agendou ${servico(servicoId).nome} para ${fmtCurta(data)} às ${hora}`);
    save();
    return ag;
  }

  function atualizarAgendamento(id, patch, origem = 'recepcao') {
    const d = load();
    const a = d.agendamentos.find((x) => x.id === id);
    if (!a) return;
    Object.assign(a, patch);
    if (patch.status) registrar(origem, `${paciente(a.pacienteId).nome}: ${STATUS[patch.status].toLowerCase()} (${fmtCurta(a.data)} ${a.hora})`);
    save();
    return a;
  }

  function atualizarOrcamento(id, patch, origem = 'recepcao') {
    const d = load();
    const o = d.orcamentos.find((x) => x.id === id);
    if (!o) return;
    Object.assign(o, patch);
    if (patch.etapa) registrar(origem, `Orçamento de ${paciente(o.pacienteId).nome} → ${ETAPAS_ORCAMENTO[patch.etapa]}`);
    save();
    return o;
  }

  const servico = (id) => SERVICOS.find((s) => s.id === id);
  const profissional = (id) => PROFISSIONAIS.find((p) => p.id === id);
  const paciente = (id) => load().pacientes.find((p) => p.id === id) || { nome: '?', tel: '' };

  return {
    CLINICA, SERVICOS, PROFISSIONAIS, STATUS, ETAPAS_ORCAMENTO, ORIGENS,
    load, save, reset, registrar,
    slots: (dataISO, servicoId) => slotsLivres(load(), dataISO, servicoId),
    proximosDiasAbertos, agendar, atualizarAgendamento, atualizarOrcamento,
    servico, profissional, paciente,
    util: { iso, parseISO, addDays, hoje, fmtData, fmtCurta, diasEntre, brl, toMin },
  };
})();
