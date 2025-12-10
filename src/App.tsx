import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  BrainCircuit,
  Bell,
  Search,
  ChevronRight,
  AlertTriangle,
  UploadCloud,
  FileSpreadsheet,
  RefreshCw,
  TrendingUp,
  Share2,
  X,
  Copy,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Legend,
  LineChart,
  Line
} from 'recharts';

// --- 模擬數據 (基於您的 113 學年度分析結果) ---

// 1. 任務完成度與進步幅度 (Bar Chart)
const taskCompletionData = [
  { name: '低任務完成群', 進步幅度: 2.1, color: '#94a3b8' },
  { name: '中任務完成群', 進步幅度: 8.2, color: '#0ea5e9' },
  { name: '高任務完成群', 進步幅度: 18.5, color: '#2563eb' },
];

// 2. XGBoost 預測模型散佈圖 (Scatter Chart)
const predictionData = Array.from({ length: 50 }, (_, i) => {
  const actual = Math.floor(Math.random() * 40) + 60; // 60-100
  const error = (Math.random() - 0.5) * 5;
  return {
    id: i,
    actual: actual,
    predicted: parseFloat((actual + error).toFixed(1)),
    cluster: actual > 85 ? 'High' : 'Normal'
  };
});

// 3. 學生預警名單 (List)
const studentList = [
  { id: 'S11301', name: '陳小明', school: '恆春國小', riskLevel: 'High', avgTime: 450, completion: 15, predictedScore: 58, warning: '只登入未練習 (無效學習)' },
  { id: 'S11302', name: '林小華', school: '車城國小', riskLevel: 'Low', avgTime: 320, completion: 92, predictedScore: 88, warning: '狀況良好' },
  { id: 'S11303', name: '張大安', school: '滿州國中', riskLevel: 'Medium', avgTime: 120, completion: 45, predictedScore: 65, warning: '投入時間不足' },
  { id: 'S11304', name: '李美美', school: '高樹國小', riskLevel: 'High', avgTime: 600, completion: 20, predictedScore: 61, warning: '無效掛機' },
  { id: 'S11305', name: '王力', school: '里港國小', riskLevel: 'Low', avgTime: 400, completion: 88, predictedScore: 91, warning: '狀況良好' },
];

// --- 組件 ---

const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${trend === 'down' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className={trend === 'down' ? 'text-red-500 font-medium' : 'text-emerald-500 font-medium'}>
        {subtext}
      </span>
      <span className="text-slate-400 ml-2">與上學期相比</span>
    </div>
  </div>
);

const RiskBadge = ({ level }: { level: string }) => {
  const styles: any = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-amber-100 text-amber-700 border-amber-200',
    Low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[level]}`}>
      {level === 'High' ? '高風險需介入' : level === 'Medium' ? '觀察中' : '狀況良好'}
    </span>
  );
};

// --- 熱力圖與互動分析組件 ---

// 模擬相關性矩陣數據 (基於 CSV 欄位)
const correlationMatrix = [
  { factor: '前測成績', values: [1, 0.65, 0.12, 0.35, -0.2] },
  { factor: '後測成績', values: [0.65, 1, 0.05, 0.82, 0.6] },
  { factor: '使用總時數', values: [0.12, 0.05, 1, 0.15, -0.05] }, // 注意這裡：時間與成績相關性低
  { factor: '任務完成數', values: [0.35, 0.82, 0.15, 1, 0.75] },
  { factor: '練習題測驗', values: [-0.2, 0.6, -0.05, 0.75, 1] },
];
const factors = ['前測成績', '後測成績', '使用總時數', '任務完成數', '練習題測驗'];

// 顏色映射函數
const getColor = (value: number) => {
  if (value === 1) return 'bg-slate-100 text-slate-400'; // 自己對自己
  if (value > 0.7) return 'bg-blue-600 text-white';
  if (value > 0.4) return 'bg-blue-400 text-white';
  if (value > 0.2) return 'bg-blue-200 text-blue-800';
  if (value > -0.1 && value < 0.1) return 'bg-slate-50 text-slate-400'; // 無相關
  return 'bg-red-100 text-red-700'; // 負相關或低相關
};

// 模擬 CSV 散佈圖數據 (時間 vs 進步分數)
const scatterDataTimeVsImprovement = Array.from({ length: 60 }, () => ({
  x: Math.floor(Math.random() * 600) + 10, // 分鐘
  y: Math.floor(Math.random() * 30) - 5,   // 進步分數
  cluster: 'student'
}));


// --- 主程式 ---

export default function StudifyPlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Analysis Tab States
  const [analysisState, setAnalysisState] = useState<'idle' | 'processing' | 'done'>('idle');
  const [csvInput, setCsvInput] = useState('');

  // Share Modal States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleAnalyze = () => {
    setAnalysisState('processing');
    // 模擬處理時間
    setTimeout(() => {
      setAnalysisState('done');
    }, 1500);
  };

  const handleCopyLink = () => {
    setIsCopied(true);
    // 模擬複製行為
    setTimeout(() => setIsCopied(false), 2000);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard title="分析學生總數" value="4,865" subtext="+12%" icon={Users} trend="up" />
              <StatCard title="高風險預警人數" value="342" subtext="+5.4%" icon={AlertTriangle} trend="down" />
              <StatCard title="預測準確度 (R²)" value="0.985" subtext="極高可信度" icon={BrainCircuit} trend="up" />
            </div>

            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Chart 1: Task Completion */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">任務完成度 vs. 成效提升</h3>
                    <p className="text-sm text-slate-500">驗證發現：完成度比使用時間更重要</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <BarChart3 size={20} className="text-blue-600" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskCompletionData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" domain={[0, 20]} />
                      <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="進步幅度" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: XGBoost Prediction */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">XGBoost 成效預測模型</h3>
                    <p className="text-sm text-slate-500">實際分數 vs. 模型預測分數 (MAE: 1.15)</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <BrainCircuit size={20} className="text-purple-600" />
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid />
                      <XAxis type="number" dataKey="actual" name="實際分數" unit="分" domain={[60, 100]} />
                      <YAxis type="number" dataKey="predicted" name="預測分數" unit="分" domain={[60, 100]} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="學生" data={predictionData} fill="#8884d8" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Feature Importance Panel (SHAP Summary Simplified) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-4">影響成效的關鍵行為 (SHAP Feature Importance)</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium text-slate-600">練習題測驗</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-blue-600 w-[95%] rounded-full"></div>
                  </div>
                  <div className="w-12 text-sm text-slate-500 font-bold">1st</div>
                </div>
                <div className="flex items-center">
                  <div className="w-32 text-sm font-medium text-slate-600">任務完成度</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-blue-500 w-[85%] rounded-full"></div>
                  </div>
                  <div className="w-12 text-sm text-slate-500 font-bold">2nd</div>
                </div>
                <div className="flex items-center opacity-50">
                  <div className="w-32 text-sm font-medium text-slate-600">使用總時數</div>
                  <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden mx-4">
                    <div className="h-full bg-slate-400 w-[20%] rounded-full"></div>
                  </div>
                  <div className="w-12 text-sm text-slate-500 font-bold">Low</div>
                </div>
              </div>
              <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded-lg flex items-start gap-2 border border-yellow-100">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <p>系統提示：數據顯示單純增加使用時數對成績幫助有限 (SHAP值低)，建議教師優先引導學生提升「練習頻率」與「任務完成度」。</p>
              </div>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">學生預警名單</h3>
                <p className="text-sm text-slate-500">基於行為數據的即時風險評估 (Actionable List)</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">匯出名單</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">學號 / 姓名</th>
                    <th className="px-6 py-4">學校</th>
                    <th className="px-6 py-4">預測學期成績</th>
                    <th className="px-6 py-4">行為指標</th>
                    <th className="px-6 py-4">風險等級</th>
                    <th className="px-6 py-4">系統診斷</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentList.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{student.name}</div>
                        <div className="text-xs text-slate-400">{student.id}</div>
                      </td>
                      <td className="px-6 py-4">{student.school}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{student.predictedScore}</span>
                          {student.predictedScore < 60 && <AlertTriangle size={14} className="text-red-500" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs gap-4">
                            <span>時數:</span>
                            <span className="font-medium">{student.avgTime} min</span>
                          </div>
                          <div className="flex justify-between text-xs gap-4">
                            <span>任務:</span>
                            <span className={`font-medium ${student.completion < 30 ? 'text-red-500' : 'text-slate-700'}`}>{student.completion}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RiskBadge level={student.riskLevel} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">
                        {student.warning}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* 1. 資料上傳區 */}
            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
               <h2 className="text-2xl font-bold text-slate-800 mb-2">深度數據分析工具</h2>
               <p className="text-slate-500 mb-6">請貼上您的班級數據 CSV (包含：前測成績, 後測成績, 使用總時數, 任務完成...)，系統將自動生成關聯分析。</p>

               <div className="flex flex-col md:flex-row gap-6">
                 <div className="flex-1">
                    <textarea
                      className="w-full h-40 p-4 rounded-lg border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="學校名稱,姓名,前測成績,後測成績,使用總時數,任務完成... (可直接將 Excel/CSV 內容貼於此處)"
                      value={csvInput}
                      onChange={(e) => setCsvInput(e.target.value)}
                    ></textarea>
                 </div>
                 <div className="w-full md:w-64 flex flex-col gap-3">
                    <button
                      onClick={() => setCsvInput('學校名稱,前測成績,後測成績,使用總時數\n範例數據A,80,85,120\n範例數據B,60,65,500...')}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                    >
                      <FileSpreadsheet size={18} />
                      載入範例數據
                    </button>
                    <button
                      onClick={handleAnalyze}
                      disabled={analysisState === 'processing'}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-md disabled:opacity-50"
                    >
                      {analysisState === 'processing' ? <RefreshCw className="animate-spin" /> : <TrendingUp />}
                      {analysisState === 'processing' ? '正在運算...' : '開始分析'}
                    </button>
                 </div>
               </div>
            </div>

            {/* 2. 分析結果顯示區 (條件渲染) */}
            {analysisState === 'done' && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">

                {/* 2.1 關鍵發現提示 */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl flex gap-4 items-start">
                   <div className="bg-indigo-100 p-2 rounded-lg">
                      <BrainCircuit className="text-indigo-600" size={24} />
                   </div>
                   <div>
                      <h4 className="font-bold text-indigo-900 text-lg">AI 數據洞察：時間投入不等於成效</h4>
                      <p className="text-indigo-700 mt-1 text-sm leading-relaxed">
                        根據您上傳的 113 學年度數據分析，我們發現 <span className="font-bold underline">「使用總時數」與「後測成績」的相關係數僅為 0.05 (極低相關)</span>。
                        反之，「任務完成數」與「練習題測驗」與成績進步呈現高度正相關 (r &gt; 0.7)。建議教學策略從「增加使用時間」轉向「提高任務完成率」。
                      </p>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 2.2 相關性熱力圖 (Custom Grid) */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">多變項相關性矩陣 (Correlation Heatmap)</h3>
                    <div className="flex-1 flex items-center justify-center">
                       <div className="grid grid-cols-6 gap-1 w-full max-w-md text-xs">
                          {/* Header Row */}
                          <div className="col-span-1"></div>
                          {factors.map((f, i) => (
                            <div key={i} className="font-bold text-slate-500 text-center rotate-45 origin-bottom-left translate-x-2 -translate-y-2">{f.substring(0,4)}</div>
                          ))}

                          {/* Matrix Rows */}
                          {correlationMatrix.map((row, i) => (
                            <React.Fragment key={i}>
                              <div className="font-bold text-slate-600 flex items-center justify-end pr-2">{row.factor}</div>
                              {row.values.map((val, j) => (
                                <div
                                  key={j}
                                  className={`h-12 flex items-center justify-center rounded transition-all hover:scale-105 cursor-pointer ${getColor(val)}`}
                                  title={`${row.factor} vs ${factors[j]}: ${val}`}
                                >
                                  {val}
                                </div>
                              ))}
                            </React.Fragment>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* 2.3 散佈圖驗證 (Scatter) */}
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">使用時間 vs 進步分數</h3>
                    <p className="text-sm text-slate-400 mb-6">每個點代表一位學生，觀察分佈是否集中於對角線</p>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid />
                          <XAxis type="number" dataKey="x" name="使用時間" unit="分" />
                          <YAxis type="number" dataKey="y" name="進步分數" unit="分" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Legend />
                          <Scatter name="學生數據分佈" data={scatterDataTimeVsImprovement} fill="#8884d8">
                            {/* 模擬離散分佈，顯示無相關性 */}
                          </Scatter>
                          {/* 趨勢線 (模擬平緩線) */}
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return <div>開發中...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <BrainCircuit className="text-blue-400 mr-3" size={28} />
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight">Studify</span>}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">總覽儀表板</span>}
          </button>

          <button
             onClick={() => setActiveTab('students')}
             className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">學生預警名單</span>}
          </button>

          <button
             onClick={() => setActiveTab('analysis')}
             className={`w-full flex items-center px-3 py-3 rounded-lg transition-colors ${activeTab === 'analysis' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 size={20} />
            {isSidebarOpen && <span className="ml-3 font-medium">深度數據分析</span>}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <ChevronRight className={isSidebarOpen ? "rotate-180" : ""} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}>

        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center text-slate-400 bg-slate-100 px-4 py-2 rounded-lg w-96">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜尋學生..."
              className="bg-transparent border-none focus:outline-none ml-2 text-sm text-slate-800 w-full"
            />
          </div>
          <div className="flex items-center gap-6">
            {/* Share Button (New) */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
            >
              <Share2 size={16} />
              分享報告
            </button>

            <button className="relative text-slate-500 hover:text-slate-700">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-800">Demo User</div>
                <div className="text-xs text-slate-500">Studify Admin</div>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && '南區數位學習監測總覽'}
              {activeTab === 'students' && '高風險學生介入清單'}
              {activeTab === 'analysis' && '相關性與行為分析'}
            </h1>
            <p className="text-slate-500 mt-1">
              {activeTab === 'dashboard' && '即時分析 4,865 位學生的數位學習行為與成效預測。'}
              {activeTab === 'students' && '系統基於 XGBoost 模型自動標記需關注的學生，請老師優先輔導。'}
              {activeTab === 'analysis' && '檢視各項行為指標與學習成效之間的統計關聯。'}
            </p>
          </div>

          {renderContent()}
        </div>
      </main>

      {/* Share Modal (New) */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">分享分析報告</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                  <Check size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 text-sm">公開連結已生成</h4>
                  <p className="text-blue-700 text-xs mt-1">
                    此連結包含目前的熱力圖與風險名單，效期為 7 天。任何擁有連結的人皆可檢視。
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">公開連結 URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://studify.edu.tw/share/report/v8x9-2m4k-analysis"
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${isCopied ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                    {isCopied ? '已複製' : '複製'}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-500 hover:text-slate-800 font-medium text-sm"
              >
                關閉視窗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}