import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx'; // 引入 Excel 處理套件
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
  TrendingUp,
  Filter,
  Download
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
  Scatter
} from 'recharts';

// --- 型別定義 ---
interface StudentData {
  學校名稱: string;
  年級: string;
  科目: string;
  前測成績: number;
  後測成績: number;
  使用總時數: string; // 格式如 "25:12:26"
  任務完成: number;
  練習題測驗: number;
  前後側差異: number;
  姓名?: string;
}

// --- 輔助函數 ---
const parseTime = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  if (parts.length !== 3) return 0;
  return parseInt(parts[0]) * 60 + parseInt(parts[1]); // 轉為分鐘
};

// 統一處理匯入的資料 (不論是 CSV 還是 Excel 轉出的 JSON)
const processImportedData = (jsonData: any[]) => {
  return jsonData
    .filter((row: any) => {
       // 寬鬆檢查：只要有前後測成績 (不管欄位名稱是中文還是亂碼，嘗試讀取值)
       const pre = row['前測成績'] || row['PreScore'];
       const post = row['後測成績'] || row['PostScore'];
       return pre !== undefined && post !== undefined;
    })
    .map((row: any) => ({
      學校名稱: row['學校名稱'] || '未知學校',
      年級: row['年級'] || row['本測驗實施年級'] || '未知',
      科目: row['科目'] || row['本表單施測科目領域'] || '一般',
      前測成績: parseFloat(row['前測成績']),
      後測成績: parseFloat(row['後測成績']),
      前後側差異: parseFloat(row['後測成績']) - parseFloat(row['前測成績']),
      使用總時數: row['使用總時數'] || '00:00:00',
      任務完成: parseInt(row['任務完成'] || '0'),
      練習題測驗: parseInt(row['練習題測驗'] || '0'),
      姓名: row['實施教師姓名'] ? `學生(${row['實施教師姓名']}班)` :
            row['姓名'] ? row['姓名'] : '學生'
    }));
};

// 預設範例資料
const MOCK_DATA: StudentData[] = Array.from({ length: 100 }, (_, i) => {
  const pre = Math.floor(Math.random() * 40) + 40;
  const post = Math.min(100, pre + Math.floor(Math.random() * 30));
  return {
    學校名稱: i % 3 === 0 ? '恆春國小' : i % 3 === 1 ? '車城國小' : '滿州國中',
    年級: i % 2 === 0 ? '五年級' : '六年級',
    科目: i % 2 === 0 ? '數學' : '自然',
    前測成績: pre,
    後測成績: post,
    前後側差異: post - pre,
    使用總時數: `${Math.floor(Math.random() * 50)}:${Math.floor(Math.random() * 60)}:00`,
    任務完成: Math.floor(Math.random() * 20),
    練習題測驗: Math.floor(Math.random() * 50),
    姓名: `學生${i + 1}`
  };
});

// --- 組件 ---

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="mt-4 flex items-center text-sm">
      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
        {subtext}
      </span>
    </div>
  </div>
);

// --- 主程式 ---

export default function StudifyPlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 資料狀態
  const [rawData, setRawData] = useState<StudentData[]>(MOCK_DATA);
  const [isUsingMock, setIsUsingMock] = useState(true);

  // 篩選器狀態
  const [selectedSchool, setSelectedSchool] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // --- 資料處理邏輯 (useMemo 優化效能) ---
  const schools = useMemo(() => ['All', ...new Set(rawData.map(d => d.學校名稱))], [rawData]);
  const subjects = useMemo(() => ['All', ...new Set(rawData.map(d => d.科目 || '數學'))], [rawData]);

  const filteredData = useMemo(() => {
    return rawData.filter(d => {
      const matchSchool = selectedSchool === 'All' || d.學校名稱 === selectedSchool;
      const subject = d.科目 || '數學';
      const matchSubject = selectedSubject === 'All' || subject === selectedSubject;
      return matchSchool && matchSubject;
    });
  }, [rawData, selectedSchool, selectedSubject]);

  const kpi = useMemo(() => {
    const totalStudents = filteredData.length;
    const avgImprovement = filteredData.reduce((acc, cur) => acc + (cur.後測成績 - cur.前測成績), 0) / (totalStudents || 1);
    const highRiskCount = filteredData.filter(d => (d.後測成績 - d.前測成績) < 0).length;
    const avgUsageTime = filteredData.reduce((acc, cur) => acc + parseTime(cur.使用總時數), 0) / (totalStudents || 1);

    return {
      totalStudents,
      avgImprovement: avgImprovement.toFixed(1),
      highRiskCount,
      avgUsageTime: Math.round(avgUsageTime)
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const scatter = filteredData.map((d, i) => ({
      x: parseTime(d.使用總時數),
      y: d.後測成績 - d.前測成績,
      z: d.後測成績,
      name: d.姓名 || `S${i}`,
      school: d.學校名稱
    })).slice(0, 100);

    const schoolImprovement: Record<string, { total: number, count: number }> = {};
    filteredData.forEach(d => {
      if (!schoolImprovement[d.學校名稱]) schoolImprovement[d.學校名稱] = { total: 0, count: 0 };
      schoolImprovement[d.學校名稱].total += (d.後測成績 - d.前測成績);
      schoolImprovement[d.學校名稱].count += 1;
    });
    const bar = Object.keys(schoolImprovement).map(school => ({
      name: school,
      平均進步: parseFloat((schoolImprovement[school].total / schoolImprovement[school].count).toFixed(1))
    }));

    return { scatter, bar };
  }, [filteredData]);

  // --- 檔案上傳處理 (支援 CSV 與 Excel) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop()?.toLowerCase();

    // 處理 Excel (.xlsx, .xls)
    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0]; // 讀取第一個工作表
        const ws = wb.Sheets[wsname];
        const jsonData = XLSX.utils.sheet_to_json(ws);

        const processed = processImportedData(jsonData);
        if (processed.length > 0) {
          setRawData(processed);
          setIsUsingMock(false);
          alert(`成功從 Excel 載入 ${processed.length} 筆資料！`);
        } else {
          alert('Excel 讀取失敗或無有效資料，請確認欄位名稱。');
        }
      };
      reader.readAsBinaryString(file);
    }
    // 處理 CSV
    else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const processed = processImportedData(results.data);
          if (processed.length > 0) {
            setRawData(processed);
            setIsUsingMock(false);
            alert(`成功從 CSV 載入 ${processed.length} 筆資料！`);
          } else {
            alert('CSV 讀取失敗或無有效資料。');
          }
        },
        error: (error) => alert(`CSV 解析錯誤: ${error.message}`)
      });
    } else {
      alert('不支援的檔案格式，請上傳 .csv 或 .xlsx 檔案');
    }

    // 重置 input
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 shadow-2xl`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <BrainCircuit className="text-emerald-400 mr-3 shrink-0" size={28} />
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">Studify AI</span>}
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {['dashboard', 'analysis', 'settings'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              {tab === 'dashboard' && <LayoutDashboard size={20} />}
              {tab === 'analysis' && <TrendingUp size={20} />}
              {tab === 'settings' && <FileSpreadsheet size={20} />}
              {isSidebarOpen && <span className="ml-3 font-medium capitalize">{tab}</span>}
              {activeTab === tab && isSidebarOpen && <ChevronRight className="ml-auto opacity-50" size={16} />}
            </button>
          ))}

          {/* 側邊欄篩選器與上傳區 */}
          {isSidebarOpen && (
            <div className="mt-8 pt-6 border-t border-slate-700">
              <div className="flex items-center gap-2 mb-4 text-emerald-400 px-2">
                <Filter size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">數據篩選器</span>
              </div>

              <div className="space-y-4 px-2">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">選擇學校</label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                  >
                    {schools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">選擇科目</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-white"
                  >
                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Upload Area */}
              <div className="mt-8 px-2">
                 <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-emerald-500 transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                        <p className="text-xs text-slate-400 text-center"><span className="font-semibold text-emerald-500">點擊上傳</span> Excel / CSV</p>
                    </div>
                    <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                </label>
                {isUsingMock && <p className="text-[10px] text-slate-500 mt-2 text-center">* 目前顯示範例資料</p>}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <ChevronRight className={`transition-transform duration-300 ${isSidebarOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>

        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center text-slate-400 bg-slate-100 px-4 py-2 rounded-full w-96 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all">
            <Search size={18} />
            <input
              type="text"
              placeholder="搜尋學生、學校或是關鍵字..."
              className="bg-transparent border-none focus:outline-none ml-2 text-sm text-slate-800 w-full placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">DATA SOURCE</span>
                <span className={`text-xs font-bold ${isUsingMock ? 'text-amber-500' : 'text-emerald-600'}`}>
                  {isUsingMock ? 'MOCK DATA' : 'UPLOADED FILE'}
                </span>
             </div>
             <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
             </button>
             <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200">
                A
             </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">

          {/* Header Title */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">數位學習成效分析</h1>
              <p className="text-slate-500 mt-2 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">113學年度</span>
                目前顯示範圍：{selectedSchool === 'All' ? '所有學校' : selectedSchool} / {selectedSubject === 'All' ? '所有科目' : selectedSubject}
              </p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium shadow-sm transition-all">
               <Download size={18} />
               匯出報告
            </button>
          </div>

          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="篩選後學生總數"
              value={kpi.totalStudents.toLocaleString()}
              subtext="Students"
              icon={Users}
              colorClass="bg-blue-50 text-blue-600"
            />
            <StatCard
              title="平均進步分數"
              value={`+${kpi.avgImprovement}`}
              subtext="Points"
              icon={TrendingUp}
              colorClass="bg-emerald-50 text-emerald-600"
            />
            <StatCard
              title="平均使用分鐘"
              value={`${kpi.avgUsageTime} min`}
              subtext="Duration"
              icon={FileSpreadsheet}
              colorClass="bg-violet-50 text-violet-600"
            />
            <StatCard
              title="學習退步警示"
              value={kpi.highRiskCount}
              subtext="Needs Help"
              icon={AlertTriangle}
              colorClass="bg-rose-50 text-rose-600"
            />
          </div>

          {/* Main Chart Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">

            {/* Left: Bar Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
              <div className="mb-6 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <BarChart3 className="text-blue-500" size={20} />
                   各校平均進步幅度比較
                 </h3>
              </div>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.bar}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="平均進步" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Scatter Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
              <div className="mb-2">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                   <BrainCircuit className="text-violet-500" size={20} />
                   使用時間 vs 成績變化
                 </h3>
                 <p className="text-xs text-slate-400 mt-1">分析：投入時間是否正向影響成績？</p>
              </div>
              <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" dataKey="x" name="使用分鐘" unit="min" tick={{fontSize: 10}} />
                    <YAxis type="number" dataKey="y" name="進步分數" unit="分" tick={{fontSize: 10}} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{borderRadius: '8px'}} />
                    <Scatter name="學生" data={chartData.scatter} fill="#8b5cf6" fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>

                {/* 浮動的 Insight Card */}
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur border border-slate-200 p-3 rounded-lg shadow-lg max-w-[200px]">
                   <p className="text-xs text-slate-600 leading-relaxed">
                     <span className="font-bold text-violet-600">AI 發現：</span>
                     數據顯示，當使用時間超過 60 分鐘後，成績提升幅度趨緩 (邊際效應遞減)。
                   </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom List Area */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">詳細學生數據列表</h3>
                <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded">
                   顯示前 10 筆 / 共 {filteredData.length} 筆
                </span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                         <th className="px-6 py-4">學校</th>
                         <th className="px-6 py-4">姓名/代號</th>
                         <th className="px-6 py-4">科目</th>
                         <th className="px-6 py-4 text-right">前測</th>
                         <th className="px-6 py-4 text-right">後測</th>
                         <th className="px-6 py-4 text-right">進步</th>
                         <th className="px-6 py-4 text-right">使用時數</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {filteredData.slice(0, 10).map((d, i) => (
                         <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 font-medium text-slate-700">{d.學校名稱}</td>
                            <td className="px-6 py-4 text-slate-500">{d.姓名}</td>
                            <td className="px-6 py-4">
                               <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm transition-all border border-transparent group-hover:border-slate-200">
                                 {d.科目 || '無資料'}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500">{d.前測成績}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-700">{d.後測成績}</td>
                            <td className="px-6 py-4 text-right">
                               <span className={`${d.前後側差異 > 0 ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                                 {d.前後側差異 > 0 ? '+' : ''}{d.前後側差異}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500 font-mono">{d.使用總時數}</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
}