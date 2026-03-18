import { useState, useMemo, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import './index.css'; 

// --- Custom Hook for LocalStorage ---
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });
  
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  
  return [value, setValue];
}

// --- Helper Components ---
const InputGroup = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-sm font-medium text-slate-600">{label}</label>
    {children}
  </div>
);

const MoneyInput = ({ value, onChange, placeholder = "0.00" }) => (
  <div className="relative">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
    <input
      type="number"
      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow text-slate-800"
      value={value === 0 ? '' : value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
    />
  </div>
);

const PercentInput = ({ value, onChange, placeholder = "0.00" }) => (
  <div className="relative">
    <input
      type="number"
      className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow text-slate-800"
      value={value === 0 ? '' : value}
      onChange={(e) => onChange(Number(e.target.value))}
      placeholder={placeholder}
    />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
  </div>
);

const NumberInput = ({ value, onChange, placeholder = "0" }) => (
  <input
    type="number"
    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow text-slate-800"
    value={value === 0 ? '' : value}
    onChange={(e) => onChange(Number(e.target.value))}
    placeholder={placeholder}
  />
);

function App() {
  // === STATE DEFINITIONS (Persisted & Default 0) ===
  const [salePrice, setSalePrice] = useStickyState(0, 'salePrice');
  const [unitsSold, setUnitsSold] = useStickyState(0, 'unitsSold');

  const [paymentFeeRate, setPaymentFeeRate] = useStickyState(0, 'paymentFeeRate');
  const [platformFeeRate, setPlatformFeeRate] = useStickyState(0, 'platformFeeRate');
  const [taxRate, setTaxRate] = useStickyState(0, 'taxRate');

  const [costPackaging, setCostPackaging] = useStickyState(0, 'costPackaging');
  const [costTagItem, setCostTagItem] = useStickyState(0, 'costTagItem');
  const [costTshirt, setCostTshirt] = useStickyState(0, 'costTshirt');
  const [costSpecialTag, setCostSpecialTag] = useStickyState(0, 'costSpecialTag');
  const [costCustomSilk, setCostCustomSilk] = useStickyState(0, 'costCustomSilk');
  const [costTag, setCostTag] = useStickyState(0, 'costTag');
  const [costPrint, setCostPrint] = useStickyState(0, 'costPrint');
  const [costShipping, setCostShipping] = useStickyState(0, 'costShipping');

  const [expenses, setExpenses] = useStickyState([], 'expenses');
  const [investments, setInvestments] = useStickyState([], 'investments');

  // Helpers for Dynamic Lists
  const addExpense = () => setExpenses([...expenses, { id: Date.now().toString(), name: '', value: 0 }]);
  const updateExpense = (id, field, val) => setExpenses(expenses.map(e => e.id === id ? { ...e, [field]: val } : e));
  const removeExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const addInvestment = () => setInvestments([...investments, { id: Date.now().toString(), name: '', value: 0 }]);
  const updateInvestment = (id, field, val) => setInvestments(investments.map(i => i.id === id ? { ...i, [field]: val } : i));
  const removeInvestment = (id) => setInvestments(investments.filter(i => i.id !== id));

  // Reset Everything to Zero
  const handleReset = () => {
    if(!window.confirm("Você tem certeza que deseja limpar e zerar todos os dados?")) return;
    setSalePrice(0);
    setUnitsSold(0);
    setPaymentFeeRate(0);
    setPlatformFeeRate(0);
    setTaxRate(0);
    setCostPackaging(0);
    setCostTagItem(0);
    setCostTshirt(0);
    setCostSpecialTag(0);
    setCostCustomSilk(0);
    setCostTag(0);
    setCostPrint(0);
    setCostShipping(0);
    setExpenses([]);
    setInvestments([]);
    window.localStorage.clear();
  };

  // Print Setup
  const contentRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: 'Relatorio_Despesas',
  });

  // === CALCULATIONS ===
  const metrics = useMemo(() => {
    const baseUnitCost = costPackaging + costTagItem + costTshirt + costSpecialTag + costCustomSilk + costTag + costPrint + costShipping;
    const feePercentageTotal = paymentFeeRate + platformFeeRate + taxRate;
    const feeCost = salePrice * (feePercentageTotal / 100);
    const cmvR$ = baseUnitCost + feeCost;

    const cmvPercent = salePrice > 0 ? (cmvR$ / salePrice) * 100 : 0;
    const mcR$ = salePrice - cmvR$;
    const mcPercent = salePrice > 0 ? (mcR$ / salePrice) * 100 : 0;

    const totalFixedExp = expenses.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    const totalInvestments = investments.reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    const totalMonthlyFixed = totalFixedExp + totalInvestments;

    const totalAdSpend = totalInvestments;

    const breakEvenR$ = mcPercent > 0 ? (totalMonthlyFixed / (mcPercent / 100)) : 0;
    const breakEvenUnits = salePrice > 0 ? breakEvenR$ / salePrice : 0;

    const revenue = unitsSold * salePrice;
    const totalVarCosts = unitsSold * cmvR$;
    const grossProfit = revenue - totalVarCosts;
    const netProfit = grossProfit - totalMonthlyFixed;
    const netProfitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

    const roas = totalAdSpend > 0 ? (revenue / totalAdSpend) : null;

    return {
      cmvPercent, mcPercent, mcR$,
      totalFixedExp, totalInvestments, totalMonthlyFixed,
      breakEvenR$, breakEvenUnits,
      revenue, netProfit, netProfitMargin, roas
    };
  }, [
    salePrice, unitsSold, paymentFeeRate, platformFeeRate, taxRate,
    costPackaging, costTagItem, costTshirt, costSpecialTag, costCustomSilk, costTag, costPrint, costShipping,
    expenses, investments
  ]);

  // Formatters
  const formatBRL = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatPct = (val) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + '%';
  const formatNum = (val) => new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(val);

  return (
    <div className="flex h-screen overflow-hidden text-slate-800 bg-slate-50 font-['Inter']">
      {/* BEGIN: Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        
      {/* Top Navigation */}
      <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10 shrink-0 print:hidden">
        <div className="flex-1 max-w-xl flex items-center text-slate-600 font-semibold text-lg">
           Visão Geral
        </div>
        <div className="flex items-center gap-5">
          <button className="text-slate-400 hover:text-slate-600 relative transition-colors">
            <i className="fa-solid fa-bell text-xl"></i>
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-500 shadow-sm cursor-pointer hover:bg-slate-300 transition-colors">
            <i className="fa-solid fa-user"></i>
          </div>
        </div>
      </header>

      {/* Page Content (Scrollable) */}
      <div className="flex-1 overflow-auto p-4 md:p-8">
          
          {/* Header & Export/Reset Buttons */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 print:mb-4">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Análise Financeira</h2>
              <p className="text-slate-500 text-sm">Ajuste os valores para visualizar a margem e o ponto de equilíbrio em tempo real.</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors self-start md:self-auto shrink-0 shadow-sm print:hidden">
                <i className="fa-solid fa-rotate-left text-sm"></i>
                <span>Resetar Dados</span>
              </button>
              <button 
                onClick={() => handlePrint()}
                className="bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 font-semibold py-2.5 px-5 rounded-xl flex items-center justify-center gap-2 transition-colors self-start md:self-auto shrink-0 shadow-sm print:hidden">
                <i className="fa-solid fa-download text-sm text-slate-400"></i>
                <span>Exportar PDF</span>
              </button>
            </div>
          </div>

          {/* MAIN GRID LAYOUT */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: Inputs (Takes up 2 cols on xl) */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Vendas & Produto */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <i className="fa-solid fa-tag text-blue-500"></i>Vendas & Produto
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputGroup label="Preço Venda Produto">
                    <MoneyInput value={salePrice} onChange={setSalePrice} />
                  </InputGroup>
                  <InputGroup label="Unidades Vendidas / Mês">
                    <NumberInput value={unitsSold} onChange={setUnitsSold} />
                  </InputGroup>
                </div>
              </div>

              {/* Taxas */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <i className="fa-solid fa-percent text-blue-500"></i>Taxas (%)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <InputGroup label="Taxa de Pagamento">
                    <PercentInput value={paymentFeeRate} onChange={setPaymentFeeRate} />
                  </InputGroup>
                  <InputGroup label="Taxa da Plataforma">
                    <PercentInput value={platformFeeRate} onChange={setPlatformFeeRate} />
                  </InputGroup>
                  <InputGroup label="Imposto (NF/Simples)">
                    <PercentInput value={taxRate} onChange={setTaxRate} />
                  </InputGroup>
                </div>
              </div>

              {/* Custos Unitários */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                  <i className="fa-solid fa-box-open text-blue-500"></i>Custos do Produto Unitário
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InputGroup label="Camiseta Lisa"><MoneyInput value={costTshirt} onChange={setCostTshirt} /></InputGroup>
                  <InputGroup label="Estampa"><MoneyInput value={costPrint} onChange={setCostPrint} /></InputGroup>
                  <InputGroup label="Embalagem"><MoneyInput value={costPackaging} onChange={setCostPackaging} /></InputGroup>
                  <InputGroup label="Etiqueta Peça"><MoneyInput value={costTagItem} onChange={setCostTagItem} /></InputGroup>
                  <InputGroup label="Tag"><MoneyInput value={costTag} onChange={setCostTag} /></InputGroup>
                  <InputGroup label="Seda Personaliz."><MoneyInput value={costCustomSilk} onChange={setCostCustomSilk} /></InputGroup>
                  <InputGroup label="Etiq. Especial"><MoneyInput value={costSpecialTag} onChange={setCostSpecialTag} /></InputGroup>
                  <InputGroup label="Custo Envio"><MoneyInput value={costShipping} onChange={setCostShipping} /></InputGroup>
                </div>
              </div>

              {/* Despesas Fixas (DYNAMIC) */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-building text-blue-500"></i>Despesas Fixas Mensais
                  </h3>
                  <button onClick={addExpense} className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors print:hidden flex items-center gap-1">
                    <i className="fa-solid fa-plus text-xs"></i> Adicionar
                  </button>
                </div>
                
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={expense.name}
                          onChange={(e) => updateExpense(expense.id, 'name', e.target.value)}
                          placeholder="Nome da Despesa"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow text-slate-800"
                        />
                      </div>
                      <div className="w-1/3 min-w-[120px]">
                        <MoneyInput value={expense.value} onChange={(val) => updateExpense(expense.id, 'value', val)} />
                      </div>
                      <button 
                        onClick={() => removeExpense(expense.id)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors print:hidden shrink-0"
                        title="Remover">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {expenses.length === 0 && <p className="text-sm text-slate-400 italic">Nenhuma despesa adicionada.</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-semibold text-slate-600 text-sm">Total Despesas Fixas:</span>
                  <span className="font-bold text-slate-900">{formatBRL(metrics.totalFixedExp)}</span>
                </div>
              </div>

               {/* Investimentos (DYNAMIC) */}
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8 print:mb-0">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <i className="fa-solid fa-bullhorn text-blue-500"></i>Investimentos / Marketing
                  </h3>
                  <button onClick={addInvestment} className="text-sm font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors print:hidden flex items-center gap-1">
                    <i className="fa-solid fa-plus text-xs"></i> Adicionar
                  </button>
                </div>
                
                <div className="space-y-3">
                  {investments.map((inv) => (
                    <div key={inv.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={inv.name}
                          onChange={(e) => updateInvestment(inv.id, 'name', e.target.value)}
                          placeholder="Nome do Investimento"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow text-slate-800"
                        />
                      </div>
                      <div className="w-1/3 min-w-[120px]">
                        <MoneyInput value={inv.value} onChange={(val) => updateInvestment(inv.id, 'value', val)} />
                      </div>
                      <button 
                        onClick={() => removeInvestment(inv.id)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors print:hidden shrink-0"
                        title="Remover">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  ))}
                  {investments.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum investimento adicionado.</p>}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                  <span className="font-semibold text-slate-600 text-sm">Total Investimentos:</span>
                  <span className="font-bold text-slate-900">{formatBRL(metrics.totalInvestments)}</span>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Results Dashboard */}
            <div className="xl:col-span-1 space-y-6">
              <div className="sticky top-6 flex flex-col gap-6">
                
                {/* Main Result Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 p-4">
                    <h3 className="font-bold text-slate-800 flex items-center justify-center gap-2">
                      <i className="fa-solid fa-chart-line text-blue-500"></i>
                      Resultado do Mês
                    </h3>
                  </div>
                  <div className="p-6 text-center">
                    <p className="text-slate-500 text-sm font-medium mb-1">Lucro Líquido Final</p>
                    <h2 className={`text-4xl font-extrabold tracking-tight ${metrics.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {formatBRL(metrics.netProfit)}
                    </h2>
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      Margem Líquida: 
                      <span className={metrics.netProfitMargin >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>
                        {formatPct(metrics.netProfitMargin)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info Cards Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-200 transition-colors">
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Faturamento Top Line</p>
                    <p className="text-xl font-bold text-slate-900">{formatBRL(metrics.revenue)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-blue-200 transition-colors">
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Custo Variável Total</p>
                    <p className="text-xl font-bold text-slate-900">{formatBRL(unitsSold * (salePrice - metrics.mcR$))}</p>
                  </div>
                  
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-red-200 transition-colors">
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">CMV (%)</p>
                    <p className="text-xl font-bold text-red-500">{formatPct(metrics.cmvPercent)}</p>
                  </div>
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 hover:border-green-200 transition-colors">
                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">Margem Contrib.</p>
                    <p className="text-xl font-bold text-green-600">{formatPct(metrics.mcPercent)}</p>
                  </div>
                </div>

                {/* Break Even Info */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                  <h4 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2">Ponto de Equilíbrio & Risco</h4>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Custo Fixo Total</p>
                      <p className="text-[10px] text-slate-400">Despesas + Investimentos</p>
                    </div>
                    <span className="font-bold text-slate-700">{formatBRL(metrics.totalMonthlyFixed)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                     <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ponto Equilíbrio (R$)</p>
                      <p className="text-[10px] text-slate-400">Para empatar (Lucro Zero)</p>
                    </div>
                    <span className="font-bold text-amber-500">{formatBRL(metrics.breakEvenR$)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                     <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ponto Equilíbrio (Qtd)</p>
                      <p className="text-[10px] text-slate-400">Unidades p/ empatar</p>
                    </div>
                    <span className="font-bold text-slate-800">{formatNum(metrics.breakEvenUnits)} und.</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <i className="fa-solid fa-bullseye text-blue-500"></i>
                      <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">ROAS</p>
                    </div>
                    <span className={`font-bold ${metrics.roas > 2 ? 'text-green-600' : metrics.roas > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                      {metrics.roas === null ? 'N/A' : `${metrics.roas.toFixed(2)}x`}
                    </span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* --- DEDICATED PDF REPORT (HIDDEN ON SCREEN) --- */}
        <div style={{ display: 'none' }}>
          <div ref={contentRef} className="p-10 w-[210mm] max-w-[210mm] min-h-[297mm] bg-white text-slate-900 mx-auto font-['Inter']" style={{ boxSizing: 'border-box' }}>
            
            {/* Report Header */}
            <div className="border-b-2 border-slate-800 pb-4 mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-900">Relatório de Despesas</h1>
                <p className="text-slate-500 mt-1 font-medium">Análise de Precificação e Rentabilidade</p>
              </div>
              <div className="text-right text-sm text-slate-500">
                Gerado em: <span className="font-semibold text-slate-700">{new Date().toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Top Summaries */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* Visão Geral */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Métricas Base</h3>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>Preço de Venda:</span> <strong className="text-slate-900">{formatBRL(salePrice)}</strong></div>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>Unidades Vendidas:</span> <strong className="text-slate-900">{formatNum(unitsSold)}</strong></div>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>Faturamento Mês:</span> <strong className="text-slate-900">{formatBRL(metrics.revenue)}</strong></div>
                <div className="flex justify-between mt-2 pt-2 text-base font-bold text-slate-900">
                  <span>Lucro Líquido:</span> 
                  <span className={metrics.netProfit >= 0 ? "text-green-600" : "text-red-600"}>{formatBRL(metrics.netProfit)}</span>
                </div>
              </div>

              {/* Margens e Risco */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Margens e Risco</h3>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>CMV (Custo Variável):</span> <strong className="text-red-500">{formatPct(metrics.cmvPercent)}</strong></div>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>Margem Contribuição:</span> <strong className="text-green-600">{formatPct(metrics.mcPercent)}</strong></div>
                <div className="flex justify-between border-b border-slate-200 py-1.5 text-sm"><span>Ponto de Equilíbrio:</span> <strong className="text-amber-600">{formatBRL(metrics.breakEvenR$)}</strong></div>
                <div className="flex justify-between mt-2 pt-2 text-base font-bold text-slate-900">
                  <span>Margem Líquida final:</span> 
                  <span className={metrics.netProfitMargin >= 0 ? "text-green-600" : "text-red-600"}>{formatPct(metrics.netProfitMargin)}</span>
                </div>
              </div>
            </div>

            {/* Break down Tables */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Produto e Taxas */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 border-b-2 border-blue-500 inline-block pb-1">Custos Unitários e Taxas</h4>
                <table className="w-full text-sm mt-3">
                  <tbody className="divide-y divide-slate-100">
                    <tr><td className="py-1.5 text-slate-600">Camiseta Lisa</td><td className="py-1.5 text-right font-semibold">{formatBRL(costTshirt)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Estampa</td><td className="py-1.5 text-right font-semibold">{formatBRL(costPrint)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Embalagem</td><td className="py-1.5 text-right font-semibold">{formatBRL(costPackaging)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Etiquetas / Tags</td><td className="py-1.5 text-right font-semibold">{formatBRL(costTagItem + costTag + costSpecialTag)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Outros Insumos / Envio</td><td className="py-1.5 text-right font-semibold">{formatBRL(costCustomSilk + costShipping)}</td></tr>
                    <tr className="bg-slate-50"><td className="py-2 text-slate-800 font-bold">Total Insumos Unitários</td><td className="py-2 text-right font-bold text-red-600">{formatBRL(costPackaging + costTagItem + costTshirt + costSpecialTag + costCustomSilk + costTag + costPrint + costShipping)}</td></tr>
                    <tr><td colSpan="2" className="py-3"></td></tr>
                    <tr><td className="py-1.5 text-slate-600">Taxa de Pagamento</td><td className="py-1.5 text-right font-semibold">{formatPct(paymentFeeRate)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Taxa da Plataforma</td><td className="py-1.5 text-right font-semibold">{formatPct(platformFeeRate)}</td></tr>
                    <tr><td className="py-1.5 text-slate-600">Imposto</td><td className="py-1.5 text-right font-semibold">{formatPct(taxRate)}</td></tr>
                  </tbody>
                </table>
              </div>

              {/* Custos Fixos Totais */}
              <div>
                <h4 className="font-bold text-slate-800 mb-2 border-b-2 border-blue-500 inline-block pb-1">Despesas Fixas e Invest.</h4>
                <table className="w-full text-sm mt-3">
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-slate-50"><td colSpan="2" className="py-1 px-2 font-bold text-slate-700">Despesas Operacionais</td></tr>
                    {expenses.filter(e => e.value > 0).map(e => (
                      <tr key={e.id}><td className="py-1.5 text-slate-600 px-2">{e.name}</td><td className="py-1.5 text-right font-semibold px-2">{formatBRL(e.value)}</td></tr>
                    ))}
                    {expenses.filter(e => e.value > 0).length === 0 && <tr><td colSpan="2" className="py-2 text-slate-400 italic px-2">Nenhuma despesa registrada.</td></tr>}
                    <tr className="border-t-2 border-slate-200"><td className="py-2 px-2 font-bold text-slate-800">Total Despesas Fixas</td><td className="py-2 px-2 text-right font-bold text-slate-800">{formatBRL(metrics.totalFixedExp)}</td></tr>

                    <tr><td colSpan="2" className="py-3"></td></tr>

                    <tr className="bg-slate-50"><td colSpan="2" className="py-1 px-2 font-bold text-slate-700">Marketing e Investimentos</td></tr>
                    {investments.filter(i => i.value > 0).map(i => (
                      <tr key={i.id}><td className="py-1.5 text-slate-600 px-2">{i.name}</td><td className="py-1.5 text-right font-semibold px-2">{formatBRL(i.value)}</td></tr>
                    ))}
                    {investments.filter(i => i.value > 0).length === 0 && <tr><td colSpan="2" className="py-2 text-slate-400 italic px-2">Nenhum investimento registrado.</td></tr>}
                    <tr className="border-t-2 border-slate-200"><td className="py-2 px-2 font-bold text-slate-800">Total Investimentos</td><td className="py-2 px-2 text-right font-bold text-slate-800">{formatBRL(metrics.totalInvestments)}</td></tr>
                    <tr><td className="py-1.5 px-2 text-blue-600 font-semibold text-xs">Retorno ROAS:</td><td className="py-1.5 px-2 text-right font-bold text-blue-600 text-xs">{metrics.roas === null ? 'N/A' : `${metrics.roas.toFixed(2)}x`}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-center">
              <p className="text-xs text-slate-400 font-medium">Relatório Automático - App Controle de Despesas</p>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
