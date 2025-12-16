
import React, { useState, useEffect } from 'react';
import { calculateBazi, calculateStartAge, isDaYunForward, calculateFirstDaYun } from '../services/baziCalculation';
import { LifeDestinyResult } from '../types';
import { Copy, CheckCircle, AlertCircle, Upload, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { BAZI_SYSTEM_INSTRUCTION } from '../constants';

interface ImportDataModeProps {
    onDataImport: (data: LifeDestinyResult) => void;
}

const ImportDataMode: React.FC<ImportDataModeProps> = ({ onDataImport }) => {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [baziInfo, setBaziInfo] = useState({
        name: '',
        gender: 'Male',
        birthYear: '',
        birthMonth: '',
        birthDay: '',
        birthHour: '',
        birthMinute: '',
        yearPillar: '',
        monthPillar: '',
        dayPillar: '',
        hourPillar: '',
        startAge: '',
        firstDaYun: '',
    });
    
    // 用于存储时间输入的临时状态
    const [birthTime, setBirthTime] = useState<string>('');
    const [jsonInput, setJsonInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showStartAgeInfo, setShowStartAgeInfo] = useState(false);
    const [showFirstDaYunInfo, setShowFirstDaYunInfo] = useState(false);

    // 计算大运方向
    const getDaYunDirection = () => {
        if (!baziInfo.yearPillar) return { isForward: true, text: '顺行 (Forward)' };
        const firstChar = baziInfo.yearPillar.trim().charAt(0);
        const yangStems = ['甲', '丙', '戊', '庚', '壬'];

        const isYangYear = yangStems.includes(firstChar);
        const isForward = baziInfo.gender === 'Male' ? isYangYear : !isYangYear;

        return {
            isForward,
            text: isForward ? '顺行 (Forward)' : '逆行 (Backward)'
        };
    };

    // 生成用户提示词
    const generateUserPrompt = () => {
        const { isForward, text: daYunDirectionStr } = getDaYunDirection();
        const genderStr = baziInfo.gender === 'Male' ? '男 (乾造)' : '女 (坤造)';
        const startAgeInt = parseInt(baziInfo.startAge) || 1;

        const directionExample = isForward
            ? "例如：第一步是【戊申】，第二步则是【己酉】（顺排）"
            : "例如：第一步是【戊申】，第二步则是【丁未】（逆排）";

        const yearStemPolarity = (() => {
            const firstChar = baziInfo.yearPillar.trim().charAt(0);
            const yangStems = ['甲', '丙', '戊', '庚', '壬'];
            return yangStems.includes(firstChar) ? '阳' : '阴';
        })();

        return `请根据以下**已经排好的**八字四柱和**指定的大运信息**进行分析。

【基本信息】
性别：${genderStr}
姓名：${baziInfo.name || "未提供"}
出生年份：${baziInfo.birthYear}年 (阳历)

【八字四柱】
年柱：${baziInfo.yearPillar} (天干属性：${yearStemPolarity})
月柱：${baziInfo.monthPillar}
日柱：${baziInfo.dayPillar}
时柱：${baziInfo.hourPillar}

【大运核心参数】
1. 起运年龄：${baziInfo.startAge} 岁 (虚岁)。
2. 第一步大运：${baziInfo.firstDaYun}。
3. **排序方向**：${daYunDirectionStr}。

【必须执行的算法 - 大运序列生成】
请严格按照以下步骤生成数据：

1. **锁定第一步**：确认【${baziInfo.firstDaYun}】为第一步大运。
2. **计算序列**：根据六十甲子顺序和方向（${daYunDirectionStr}），推算出接下来的 9 步大运。
   ${directionExample}
3. **填充 JSON**：
   - Age 1 到 ${startAgeInt - 1}: daYun = "童限"
   - Age ${startAgeInt} 到 ${startAgeInt + 9}: daYun = [第1步大运: ${baziInfo.firstDaYun}]
   - Age ${startAgeInt + 10} 到 ${startAgeInt + 19}: daYun = [第2步大运]
   - ...以此类推直到 100 岁。

【特别警告】
- **daYun 字段**：必须填大运干支（10年一变），**绝对不要**填流年干支。
- **ganZhi 字段**：填入该年份的**流年干支**（每年一变，例如 2024=甲辰，2025=乙巳）。

任务：
1. 确认格局与喜忌。
2. 生成 **1-100 岁 (虚岁)** 的人生流年K线数据。
3. 在 \`reason\` 字段中提供流年详批。
4. 生成带评分的命理分析报告（包含性格分析、币圈交易分析、发展风水分析）。

请严格按照系统指令生成 JSON 数据。务必只返回纯JSON格式数据，不要包含任何markdown代码块标记或其他文字说明。`;
    };

    // 复制完整提示词
    const copyFullPrompt = async () => {
        const fullPrompt = `=== 系统指令 (System Prompt) ===\n\n${BAZI_SYSTEM_INSTRUCTION}\n\n=== 用户提示词 (User Prompt) ===\n\n${generateUserPrompt()}`;

        try {
            await navigator.clipboard.writeText(fullPrompt);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('复制失败', err);
        }
    };

    // 解析导入的 JSON
    const handleImport = () => {
        setError(null);

        if (!jsonInput.trim()) {
            setError('请粘贴 AI 返回的 JSON 数据');
            return;
        }

        try {
            // 尝试从可能包含 markdown 的内容中提取 JSON
            let jsonContent = jsonInput.trim();

            // 提取 ```json ... ``` 中的内容
            const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                jsonContent = jsonMatch[1].trim();
            } else {
                // 尝试找到 JSON 对象
                const jsonStartIndex = jsonContent.indexOf('{');
                const jsonEndIndex = jsonContent.lastIndexOf('}');
                if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
                    jsonContent = jsonContent.substring(jsonStartIndex, jsonEndIndex + 1);
                }
            }

            const data = JSON.parse(jsonContent);

            // 校验数据
            if (!data.chartPoints || !Array.isArray(data.chartPoints)) {
                throw new Error('数据格式不正确：缺少 chartPoints 数组');
            }

            if (data.chartPoints.length < 10) {
                throw new Error('数据不完整：chartPoints 数量太少');
            }

            // 转换为应用所需格式
            const result: LifeDestinyResult = {
                chartData: data.chartPoints,
                analysis: {
                    bazi: data.bazi || [],
                    summary: data.summary || "无摘要",
                    summaryScore: data.summaryScore || 5,
                    personality: data.personality || "无性格分析",
                    personalityScore: data.personalityScore || 5,
                    industry: data.industry || "无",
                    industryScore: data.industryScore || 5,
                    fengShui: data.fengShui || "建议多亲近自然，保持心境平和。",
                    fengShuiScore: data.fengShuiScore || 5,
                    wealth: data.wealth || "无",
                    wealthScore: data.wealthScore || 5,
                    marriage: data.marriage || "无",
                    marriageScore: data.marriageScore || 5,
                    health: data.health || "无",
                    healthScore: data.healthScore || 5,
                    family: data.family || "无",
                    familyScore: data.familyScore || 5,
                    crypto: data.crypto || "暂无交易分析",
                    cryptoScore: data.cryptoScore || 5,
                    cryptoYear: data.cryptoYear || "待定",
                    cryptoStyle: data.cryptoStyle || "现货定投",
                },
            };

            onDataImport(result);
        } catch (err: any) {
            setError(`解析失败：${err.message}`);
        }
    };

    const handleBaziChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'birthTime') {
            // 处理时间输入
            setBirthTime(value);
            if (value) {
                const [hour, minute] = value.split(':');
                setBaziInfo((prev) => ({
                    ...prev, 
                    birthHour: hour, 
                    birthMinute: minute
                }));
            } else {
                setBaziInfo((prev) => ({
                    ...prev, 
                    birthHour: '', 
                    birthMinute: ''
                }));
            }
        } else {
            setBaziInfo(prev => ({ ...prev, [name]: value }));
        }
    };
    
    // 自动计算四柱、起运年龄和第一步大运
    useEffect(() => {
        const { birthYear, birthMonth, birthDay, birthHour, birthMinute, gender } = baziInfo;
        
        // 检查是否所有必要的字段都已填写且是有效数字
        if (birthYear && birthMonth && birthDay && birthHour && birthMinute && gender &&
            !isNaN(Number(birthYear)) && !isNaN(Number(birthMonth)) &&
            !isNaN(Number(birthDay)) && !isNaN(Number(birthHour)) && !isNaN(Number(birthMinute))) {
            
            const year = parseInt(birthYear);
            const month = parseInt(birthMonth);
            const day = parseInt(birthDay);
            const hour = parseInt(birthHour);
            const minute = parseInt(birthMinute);
            
            // 检查日期的有效性
            if (month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                return;
            }
            
            try {
                // 计算四柱
                const { yearPillar, monthPillar, dayPillar, hourPillar } = calculateBazi(year, month, day, hour, minute);
                
                // 计算起运年龄
                const startAge = calculateStartAge(year, month, day, gender);
                
                // 计算大运方向
                const forward = isDaYunForward(yearPillar, gender);
                
                // 计算第一步大运
                const firstDaYun = calculateFirstDaYun(monthPillar, forward);
                
                setBaziInfo(prev => ({
                    ...prev,
                    yearPillar,
                    monthPillar,
                    dayPillar,
                    hourPillar,
                    startAge: startAge.toString(),
                    firstDaYun
                }));
            } catch (error) {
                console.error('计算八字信息时出错:', error);
            }
        }
    }, [baziInfo.birthYear, baziInfo.birthMonth, baziInfo.birthDay, baziInfo.birthHour, baziInfo.birthMinute, baziInfo.gender]);

    const isStep1Valid = baziInfo.birthYear && baziInfo.yearPillar && baziInfo.monthPillar &&
        baziInfo.dayPillar && baziInfo.hourPillar && baziInfo.startAge && baziInfo.firstDaYun;

    return (
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            {/* 步骤指示器 */}
            <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                    <React.Fragment key={s}>
                        <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === s
                                ? 'bg-indigo-600 text-white scale-110'
                                : step > s
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                        >
                            {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                        </div>
                        {s < 3 && <div className={`w-16 h-1 rounded ${step > s ? 'bg-green-500' : 'bg-gray-200'}`} />}
                    </React.Fragment>
                ))}
            </div>

            {/* 步骤 1: 输入八字信息 */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第一步：输入出生日期时间</h2>
                        <p className="text-gray-500 text-sm">系统将自动计算四柱信息</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">姓名 (可选)</label>
                            <input
                                type="text"
                                name="name"
                                value={baziInfo.name}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="姓名"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1">性别</label>
                            <select
                                name="gender"
                                value={baziInfo.gender}
                                onChange={handleBaziChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Male">乾造 (男)</option>
                                <option value="Female">坤造 (女)</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                        <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
                            <Sparkles className="w-4 h-4" />
                            <span>四柱干支</span>
                        </div>

                        {/* Birth Date Time Input */}
                        <div className="space-y-4 mb-4">
                            {/* Date Inputs */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">出生日期 (阳历)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <input
                                            type="number"
                                            name="birthYear"
                                            min="1900"
                                            max="2100"
                                            value={baziInfo.birthYear}
                                            onChange={handleBaziChange}
                                            placeholder="年"
                                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="birthMonth"
                                            min="1"
                                            max="12"
                                            value={baziInfo.birthMonth}
                                            onChange={handleBaziChange}
                                            placeholder="月"
                                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            name="birthDay"
                                            min="1"
                                            max="31"
                                            value={baziInfo.birthDay}
                                            onChange={handleBaziChange}
                                            placeholder="日"
                                            className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            {/* Time Input */}
                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">出生时间</label>
                                <input
                                    type="time"
                                    name="birthTime"
                                    value={birthTime}
                                    onChange={handleBaziChange}
                                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {(['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'] as const).map((field, i) => (
                                <div key={field}>
                                    <label className="block text-xs font-bold text-gray-600 mb-1">{['年柱', '月柱', '日柱', '时柱'][i]}</label>
                                    <input
                                        type="text"
                                        name={field}
                                        value={baziInfo[field]}
                                        readOnly
                                        placeholder={['甲子', '乙丑', '丙寅', '丁卯'][i]}
                                        className="w-full px-3 py-2 border border-amber-200 rounded-lg outline-none bg-gradient-to-r from-amber-50 to-yellow-50 text-center font-serif-sc font-bold text-amber-800"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-gray-600">起运年龄 (虚岁)</label>
                                    <button
                                        onClick={() => setShowStartAgeInfo(!showStartAgeInfo)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        {showStartAgeInfo ? '收起' : '查看'}
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    name="startAge"
                                    value={baziInfo.startAge}
                                    onChange={handleBaziChange}
                                    placeholder="如: 8"
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold mb-2"
                                />
                                {showStartAgeInfo && (
                                    <div className="bg-green-50 text-green-800 text-xs px-3 py-2 rounded-md border border-green-100 mb-4">
                                        <span className="font-bold">什么是起运年龄？</span><br />
                                        起运年龄是指开始走大运的年龄（虚岁），它是根据出生季节和日期计算的。<br />
                                        比如春天出生的人通常在出生后4个月起运，起运年龄就是1岁。
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-bold text-gray-600">第一步大运</label>
                                    <button
                                        onClick={() => setShowFirstDaYunInfo(!showFirstDaYunInfo)}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                        {showFirstDaYunInfo ? '收起' : '查看'}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    name="firstDaYun"
                                    value={baziInfo.firstDaYun}
                                    onChange={handleBaziChange}
                                    placeholder="如: 辛酉"
                                    className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold mb-2"
                                />
                                {showFirstDaYunInfo && (
                                    <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-md border border-blue-100 mb-4">
                                        <span className="font-bold">什么是第一步大运？</span><br />
                                        每个人从起运年龄开始，每10年有一个主要运势变化，这就是大运。<br />
                                        第一步大运是指从起运年龄开始的第一个10年运势，比如起运年龄是8岁，那么8-17岁就是你的第一步大运。<br />
                                        它是你人生运势的起点，对后续发展有重要影响。<br /><br />
                                        <span className="font-bold">如何填写？</span><br />
                                        示例：如果你是1990年1月1日出生，通过八字排盘得出起运年龄是8岁，第一步大运是「辛酉」，那么这里就填「辛酉」。
                                    </div>
                                )}
                            </div>
                        </div>
                        <p className="text-xs text-indigo-600/70 mt-2 text-center">
                            大运方向：<span className="font-bold text-indigo-900">{getDaYunDirection().text}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setStep(2)}
                        disabled={!isStep1Valid}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                        下一步：生成提示词 <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* 步骤 2: 复制提示词 */}
            {step === 2 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第二步：复制提示词</h2>
                        <p className="text-gray-500 text-sm">将提示词粘贴到任意 AI 聊天工具</p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3 mb-4">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                            <div>
                                <h3 className="font-bold text-gray-800">支持的 AI 工具</h3>
                                <p className="text-sm text-gray-600">ChatGPT、Claude、Gemini、通义千问、文心一言 等</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-64 overflow-y-auto mb-4">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                {generateUserPrompt().substring(0, 500)}...
                            </pre>
                        </div>

                        <button
                            onClick={copyFullPrompt}
                            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                        >
                            {copied ? (
                                <>
                                    <CheckCircle className="w-5 h-5" />
                                    已复制到剪贴板！
                                </>
                            ) : (
                                <>
                                    <Copy className="w-5 h-5" />
                                    复制完整提示词
                                </>
                            )}
                        </button>
                    </div>

                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-2">📝 使用说明</h4>
                        <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                            <li>点击上方按钮复制提示词</li>
                            <li>打开任意 AI 聊天工具（如 ChatGPT）</li>
                            <li>粘贴提示词并发送</li>
                            <li>等待 AI 生成完整的 JSON 数据</li>
                            <li>复制 AI 的回复，回到这里进行下一步</li>
                        </ol>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(1)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={() => setStep(3)}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            下一步：导入数据 <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 步骤 3: 导入 JSON */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-serif-sc text-gray-800 mb-2">第三步：导入 AI 回复</h2>
                        <p className="text-gray-500 text-sm">粘贴 AI 返回的 JSON 数据</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            <Upload className="w-4 h-4 inline mr-2" />
                            粘贴 AI 返回的 JSON 数据
                        </label>
                        <textarea
                            value={jsonInput}
                            onChange={(e) => setJsonInput(e.target.value)}
                            placeholder='将 AI 返回的 JSON 数据粘贴到这里...&#10;&#10;例如:&#10;{&#10;  "bazi": ["癸未", "壬戌", "丙子", "庚寅"],&#10;  "chartPoints": [...],&#10;  ...&#10;}'
                            className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs resize-none"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-lg border border-red-200">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setStep(2)}
                            className="flex-1 py-3 rounded-xl font-bold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
                        >
                            ← 上一步
                        </button>
                        <button
                            onClick={handleImport}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Sparkles className="w-5 h-5" />
                            生成人生K线
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImportDataMode;
