import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  Download,
  Settings,
  Trash2,
  Info,
  Loader2,
  Tag // 新增 Tag 圖示
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
type StudentTag = '無效學習' | '潛力股' | '需關懷' | '穩定';

interface StudentData {
  學校名稱: string;
  年級: string;
  科目: string;
  前測成績: number;
  後測成績: number;
  使用總時數: string;
  任務完成: number;
  練習題測驗: number;
  前後側差異: number;
  姓名?: string;
  tag?: StudentTag; // 新增標籤欄位
}

// --- 輔助函數 ---
const parseTime = (val: any) => {
  if (!val) return 0;
  if (typeof val === 'number') return Math.round(val * 24 * 60);
  const timeStr = String(val).trim();
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours * 60 + minutes;
  }
  return 0;
};

// --- AI 標籤演算法 (核心邏輯) ---
const getSmartTag = (pre: number, post: number, minutes: number): StudentTag => {
  const improvement = post - pre;

  if (post < 60) return '需關懷'; // 不及格優先標記
  if (minutes > 60 && improvement <= 0) return '無效學習'; // 時間長卻沒進步
  if (minutes < 30 && improvement >= 10) return '潛力股'; // 時間短但進步快
  return '穩定';
};

// 標籤顏色設定
const TAG_STYLES = {
  '無效學習': 'bg-rose-100 text-rose-700 border-rose-200',
  '潛力股': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '需關懷': 'bg-amber-100 text-amber-700 border-amber-200',
  '穩定': 'bg-slate-100 text-slate-600 border-slate-200',
};

// 處理匯入資料
const processImportedData = (jsonData: any[]): StudentData[] => {
  return jsonData
    .filter((row: any) => {
       const pre = row['前測成績'] || row['PreScore'];
       const post = row['後測成績'] || row['PostScore'];
       return pre !== undefined && post !== undefined;
    })
    .map((row: any) => {
      const pre = parseFloat(row['前測成績']);
      const post = parseFloat(row['後測成績']);
      const timeStr = row['使用總時數'] || '00:00:00';
      const minutes = parseTime(timeStr);

      return {
        學校名稱: row['學校名稱'] || '未知學校',
        年級: row['年級'] || row['本測驗實施年級'] || '未知',
        科目: row['科目'] || row['本表單施測科目領域'] || '一般',
        前測成績: pre,
        後測成績: post,
        前後側差異: post - pre,
        使用總時數: timeStr,
        任務完成: parseInt(row['任務完成'] || '0'),
        練習題測驗: parseInt(row['練習題測驗'] || '0'),
        姓名: row['實施教師姓名'] ? `學生(${row['實施教師姓名']}班)` : row['姓名'] ? row['姓名'] : '學生',
        tag: getSmartTag(pre, post, minutes) // 自動打標籤
      };
    });
};

// 預設範例資料
const MOCK_DATA: StudentData[] = Array.from({ length: 100 }, (_, i) => {
  const pre = Math.floor(Math.random() * 40) + 40; // 40-80
  const post = Math.min(100, pre + Math.floor(Math.random() * 40) - 10); // -10 到 +30
  const hours = Math.floor(Math.random() * 2);
  const mins = Math.floor(Math.random() * 60);
  const timeStr = `${hours}:${mins}:00`;
  const totalMins = hours * 60 + mins;

  return {
    學校名稱: i % 3 === 0 ? '恆春國小' : i % 3 === 1 ? '車城國小' : '滿州國中',
    年級: i % 2 === 0 ? '五年級' : '六年級',
    科目: i % 2 === 0 ? '數學' : '自然',
    前測成績: pre,
    後測成績: post,
    前後側差異: post - pre,
    使用總時數: timeStr,
    任務完成: Math.floor(Math.random() * 20),
    練習題測驗: Math.floor(Math.random() * 50),
    姓名: `學生${i + 1}`,
    tag: getSmartTag(pre, post, totalMins)
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
      <span className="text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-full text-xs">
        {subtext}
      </span>
    </div>
  </div>
);

// --- 主程式 ---

export default function StudifyPlatform() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [rawData, setRawData] = useState<StudentData[]>(MOCK_DATA);
  const [isUsingMock, setIsUsingMock] = useState(true);

  const [selectedSchool, setSelectedSchool] = useState<string>('All');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');

  // --- 資料處理邏輯 ---
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

    // 計算各種標籤的人數
    const potentialCount = filteredData.filter(d => d.tag === '潛力股').length;
    const ineffectiveCount = filteredData.filter(d => d.tag === '無效學習').length;
    const attentionCount = filteredData.filter(d => d.tag === '需關懷').length;

    return {
      totalStudents,
      avgImprovement: avgImprovement.toFixed(1),
      potentialCount,
      ineffectiveCount,
      attentionCount
    };
  }, [filteredData]);

  const chartData = useMemo(() => {
    const scatter = filteredData.map((d, i) => ({
      x: parseTime(d.使用總時數),
      y: d.後測成績 - d.前測成績,
      z: d.後測成績,
      name: d.姓名 || `S${i}`,
      school: d.學校名稱,
      tag: d.tag // 傳入 tag 以便將來擴充圖表顏色
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

  const handleExportPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#f8fafc' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.setFontSize(16);
      pdf.text("Studify AI Learning Report", 10, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 10, 22);
      pdf.addImage(imgData, 'PNG', 0, 30, pdfWidth, imgHeight);
      pdf.save(`Studify_Report.pdf`);
    } catch (error) {
      alert('匯出失敗');
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop()?.toLowerCase();

    const processFile = (data: any[]) => {
        const processed = processImportedData(data);
        if (processed.length > 0) {
          setRawData(processed);
          setIsUsingMock(false);
          alert(`成功載入 ${processed.length} 筆資料！AI 已完成自動診斷。`);
        } else {
          alert('讀取失敗，無有效資料。');
        }
    };

    if (fileExt === 'xlsx' || fileExt === 'xls') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const wb = XLSX.read(evt.target?.result, { type: 'binary' });
        const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        processFile(jsonData);
      };
      reader.readAsBinaryString(file);
    } else if (fileExt === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processFile(results.data)
      });
    }
    e.target.value = '';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="學生總數" value={kpi.totalStudents.toLocaleString()} subtext="Students" icon={Users} colorClass="bg-blue-50 text-blue-600" />
              <StatCard title="潛力股學生" value={kpi.potentialCount} subtext="High Potential" icon={TrendingUp} colorClass="bg-emerald-50 text-emerald-600" />
              <StatCard title="無效學習警示" value={kpi.ineffectiveCount} subtext="Ineffective" icon={AlertTriangle} colorClass="bg-rose-50 text-rose-600" />
              <StatCard title="需關懷人數" value={kpi.attentionCount} subtext="Needs Help" icon={BrainCircuit} colorClass="bg-amber-50 text-amber-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
              <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                <div className="mb-6"><h3 className="text-lg font-bold text-slate-800">各校平均進步幅度</h3></div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.bar}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="平均進步" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col">
                <div className="mb-2">
                   <h3 className="text-lg font-bold text-slate-800">使用時間 vs 成績變化</h3>
                   <p className="text-xs text-slate-400">觀察投入時間與成效的關聯</p>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" dataKey="x" name="使用分鐘" unit="min" />
                      <YAxis type="number" dataKey="y" name="進步分數" unit="分" />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter name="學生" data={chartData.scatter} fill="#8b5cf6" fillOpacity={0.6} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analysis':
        return (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden animate-in fade-in duration-500">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">詳細學生數據列表</h3>
                  <p className="text-sm text-slate-500 mt-1">AI 自動診斷標籤已啟用</p>
                </div>
                <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                   筆數: {filteredData.length}
                </span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                   <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                         <th className="px-6 py-4 whitespace-nowrap">學校</th>
                         <th className="px-6 py-4 whitespace-nowrap">姓名</th>
                         <th className="px-6 py-4 text-center">AI 診斷</th>
                         <th className="px-6 py-4 text-right">前測</th>
                         <th className="px-6 py-4 text-right">後測</th>
                         <th className="px-6 py-4 text-right">進步</th>
                         <th className="px-6 py-4 text-right">使用時數</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {filteredData.slice(0, 50).map((d, i) => (
                         <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-700">{d.學校名稱}</td>
                            <td className="px-6 py-4 text-slate-500">{d.姓名}</td>
                            <td className="px-6 py-4 text-center">
                               <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${d.tag ? TAG_STYLES[d.tag] : TAG_STYLES['穩定']}`}>
                                 {d.tag}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-500">{d.前測成績}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-700">{d.後測成績}</td>
                            <td className="px-6 py-4 text-right">
                               <span className={`${d.前後側差異 > 0 ? 'text-emerald-600' : 'text-rose-500'} font-bold`}>
                                 {d.前後側差異 > 0 ? '+' : ''}{d.前後側差異}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right text-slate-600 font-mono">{parseTime(d.使用總時數)} min</td>
                         </tr>
                      ))}
                   </tbody>
                </table>
                {filteredData.length > 50 && (
                  <div className="p-4 text-center text-slate-400 text-xs border-t border-slate-100">
                    僅顯示前 50 筆資料
                  </div>
                )}
             </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Settings className="text-slate-600" />
                系統設定
              </h2>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 mb-6">
                <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-2">
                  <Tag size={18} />
                  AI 分群規則說明
                </h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li><span className="font-bold">無效學習</span>：使用 > 60 分鐘且進步分數 ≤ 0</li>
                  <li><span className="font-bold">潛力股</span>：使用 < 30 分鐘且進步分數 ≥ 10</li>
                  <li><span className="font-bold">需關懷</span>：後測成績 < 60 分</li>
                  <li><span className="font-bold">穩定發展</span>：其他情況</li>
                </ul>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <div className="font-medium text-slate-900">重置資料</div>
                  <div className="text-xs text-slate-500">恢復為預設範例資料</div>
                </div>
                <button
                  onClick={() => { if(confirm('確定重置？')) { setRawData(MOCK_DATA); setIsUsingMock(true); }}}
                  className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-medium text-sm flex items-center gap-2"
                >
                  <Trash2 size={16} /> 重置
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Loading...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <aside className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex flex-col fixed h-full z-20 shadow-2xl`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <BrainCircuit className="text-emerald-400 mr-3 shrink-0" size={28} />
          {isSidebarOpen && <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-blue-500 text-transparent bg-clip-text">Studify AI</span>}
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {[
            { id: 'dashboard', label: '總覽儀表板', icon: LayoutDashboard },
            { id: 'analysis', label: '詳細數據列表', icon: FileSpreadsheet },
            { id: 'settings', label: '系統設定', icon: Settings }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <item.icon size={20} />
              {isSidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
            </button>
          ))}
          {isSidebarOpen && (
            <div className="mt-8 pt-6 border-t border-slate-700 px-2 space-y-4">
              <div className="flex items-center gap-2 text-emerald-400"><Filter size={16} /><span className="text-xs font-bold uppercase">篩選器</span></div>
              <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500">
                {schools.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-emerald-500">
                {subjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-700 border-dashed rounded-xl cursor-pointer bg-slate-800/50 hover:bg-slate-800 hover:border-emerald-500 transition-all group mt-4">
                  <div className="flex flex-col items-center justify-center pt-2 pb-3">
                      <UploadCloud className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mb-2 transition-colors" />
                      <p className="text-xs text-slate-400 text-center"><span className="font-semibold text-emerald-500">上傳</span> Excel / CSV</p>
                  </div>
                  <input type="file" accept=".csv, .xlsx, .xls" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>
          )}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-full flex justify-center p-2 rounded-lg hover:bg-slate-800 text-slate-400"><ChevronRight className={`${isSidebarOpen ? "rotate-180" : ""}`} /></button>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'ml-72' : 'ml-20'}`}>
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 px-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center text-slate-400 bg-slate-100 px-4 py-2 rounded-full w-96"><Search size={18} /><input type="text" placeholder="搜尋..." className="bg-transparent border-none focus:outline-none ml-2 text-sm w-full" /></div>
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-2"><span className="text-xs font-bold text-slate-400 uppercase">SOURCE</span><span className={`text-xs font-bold ${isUsingMock ? 'text-amber-500' : 'text-emerald-600'}`}>{isUsingMock ? 'MOCK' : 'UPLOADED'}</span></div>
             <button className="p-2 text-slate-400 hover:text-blue-600 rounded-full relative"><Bell size={20} /><span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span></button>
             <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">A</div>
          </div>
        </header>

        <div id="report-content" className="p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50 min-h-[calc(100vh-64px)]">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">數位學習成效分析</h1>
              <p className="text-slate-500 mt-2 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">113學年度</span>目前顯示：{selectedSchool === 'All' ? '所有學校' : selectedSchool} / {selectedSubject === 'All' ? '所有科目' : selectedSubject}</p>
            </div>
            <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium shadow-sm transition-all disabled:opacity-50">
               {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}{isExporting ? '處理中...' : '匯出 PDF'}
            </button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}