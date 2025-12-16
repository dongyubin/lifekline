
import React, { useState, useMemo, useEffect } from 'react';
import { UserInput, Gender } from '../types';
import { Loader2, Sparkles, TrendingUp, Settings } from 'lucide-react';
import { calculateBazi } from '../services/baziCalculation';

interface BaziFormProps {
  onSubmit: (data: UserInput) => void;
  isLoading: boolean;
}

const BaziForm: React.FC<BaziFormProps> = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<UserInput>({
    name: '',
    gender: Gender.MALE,
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
    modelName: 'gemini-3-pro-preview',
    apiBaseUrl: 'https://max.openai365.top/v1',
    apiKey: '',
  });

  // 用于存储时间输入的临时状态
  const [birthTime, setBirthTime] = useState<string>('');

  const [formErrors, setFormErrors] = useState<{ modelName?: string, apiBaseUrl?: string, apiKey?: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'birthTime') {
      // 处理时间输入
      setBirthTime(value);
      if (value) {
        const [hour, minute] = value.split(':');
        setFormData((prev) => ({
          ...prev,
          birthHour: hour,
          birthMinute: minute
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          birthHour: '',
          birthMinute: ''
        }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error when user types
      if (name === 'apiBaseUrl' || name === 'apiKey' || name === 'modelName') {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
      }
    }
  };

  // 自动计算四柱
  useEffect(() => {
    const { birthYear, birthMonth, birthDay, birthHour, birthMinute } = formData;
    
    // 检查是否所有必要的字段都已填写且是有效数字
    if (birthYear && birthMonth && birthDay && birthHour && birthMinute &&
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
        const { yearPillar, monthPillar, dayPillar, hourPillar } = calculateBazi(year, month, day, hour, minute);
        
        setFormData(prev => ({
          ...prev,
          yearPillar,
          monthPillar,
          dayPillar,
          hourPillar
        }));
      } catch (error) {
        console.error('计算四柱时出错:', error);
      }
    }
  }, [formData.birthYear, formData.birthMonth, formData.birthDay, formData.birthHour, formData.birthMinute]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate API Config
    const errors: { modelName?: string, apiBaseUrl?: string, apiKey?: string } = {};
    if (!formData.modelName.trim()) {
      errors.modelName = '请输入模型名称';
    }
    if (!formData.apiBaseUrl.trim()) {
      errors.apiBaseUrl = '请输入 API Base URL';
    }
    if (!formData.apiKey.trim()) {
      errors.apiKey = '请输入 API Key';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    onSubmit(formData);
  };

  // Calculate direction for UI feedback
  const daYunDirectionInfo = useMemo(() => {
    if (!formData.yearPillar) return '等待输入年柱...';

    const firstChar = formData.yearPillar.trim().charAt(0);
    const yinStems = ['乙', '丁', '己', '辛', '癸'];

    let isYangYear = true; // default assume Yang if unknown
    if (yinStems.includes(firstChar)) isYangYear = false;

    let isForward = false;
    if (formData.gender === Gender.MALE) {
      isForward = isYangYear; // Male Yang = Forward, Male Yin = Backward
    } else {
      isForward = !isYangYear; // Female Yin = Forward, Female Yang = Backward
    }

    return isForward ? '顺行 (阳男/阴女)' : '逆行 (阴男/阳女)';
  }, [formData.yearPillar, formData.gender]);

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-serif-sc font-bold text-gray-800 mb-2">八字排盘</h2>
        <p className="text-gray-500 text-sm">请输入四柱与大运信息以生成分析</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Name & Gender */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 (可选)</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="姓名"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.MALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.MALE
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                乾造 (男)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, gender: Gender.FEMALE })}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition ${formData.gender === Gender.FEMALE
                    ? 'bg-white text-pink-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                坤造 (女)
              </button>
            </div>
          </div>
        </div>

        {/* Four Pillars Manual Input */}
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
          <div className="flex items-center gap-2 mb-3 text-amber-800 text-sm font-bold">
            <Sparkles className="w-4 h-4" />
            <span>输入出生日期时间 (自动计算四柱)</span>
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
                    required
                    min="1900"
                    max="2100"
                    value={formData.birthYear}
                    onChange={handleChange}
                    placeholder="年"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="birthMonth"
                    required
                    min="1"
                    max="12"
                    value={formData.birthMonth}
                    onChange={handleChange}
                    placeholder="月"
                    className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold text-center"
                  />
                </div>
                <div>
                  <input
                    type="number"
                    name="birthDay"
                    required
                    min="1"
                    max="31"
                    value={formData.birthDay}
                    onChange={handleChange}
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
                required
                value={birthTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">年柱 (Year)</label>
              <input
                type="text"
                name="yearPillar"
                required
                value={formData.yearPillar}
                readOnly
                placeholder="如: 甲子"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg outline-none bg-gradient-to-r from-amber-50 to-yellow-50 text-center font-serif-sc font-bold text-amber-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">月柱 (Month)</label>
              <input
                type="text"
                name="monthPillar"
                required
                value={formData.monthPillar}
                readOnly
                placeholder="如: 丙寅"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg outline-none bg-gradient-to-r from-amber-50 to-yellow-50 text-center font-serif-sc font-bold text-amber-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">日柱 (Day)</label>
              <input
                type="text"
                name="dayPillar"
                required
                value={formData.dayPillar}
                readOnly
                placeholder="如: 戊辰"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg outline-none bg-gradient-to-r from-amber-50 to-yellow-50 text-center font-serif-sc font-bold text-amber-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">时柱 (Hour)</label>
              <input
                type="text"
                name="hourPillar"
                required
                value={formData.hourPillar}
                readOnly
                placeholder="如: 壬戌"
                className="w-full px-3 py-2 border border-amber-200 rounded-lg outline-none bg-gradient-to-r from-amber-50 to-yellow-50 text-center font-serif-sc font-bold text-amber-800"
              />
            </div>
          </div>
        </div>

        {/* Da Yun Manual Input */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-3 text-indigo-800 text-sm font-bold">
            <TrendingUp className="w-4 h-4" />
            <span>大运排盘信息 (必填)</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">起运年龄 (虚岁)</label>
              <input
                type="number"
                name="startAge"
                required
                min="1"
                max="100"
                value={formData.startAge}
                onChange={handleChange}
                placeholder="如: 3"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">第一步大运</label>
              <input
                type="text"
                name="firstDaYun"
                required
                value={formData.firstDaYun}
                onChange={handleChange}
                placeholder="如: 丁卯"
                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-center font-serif-sc font-bold"
              />
            </div>
          </div>
          <p className="text-xs text-indigo-600/70 mt-2 text-center">
            当前大运排序规则：
            <span className="font-bold text-indigo-900">{daYunDirectionInfo}</span>
          </p>
        </div>

        {/* API Configuration Section */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex items-center gap-2 mb-3 text-gray-700 text-sm font-bold">
            <Settings className="w-4 h-4" />
            <span>模型接口设置 (必填)</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">使用模型</label>
              <input
                type="text"
                name="modelName"
                value={formData.modelName}
                onChange={handleChange}
                placeholder="gemini-3-pro-preview"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.modelName ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.modelName && <p className="text-red-500 text-xs mt-1">{formErrors.modelName}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Base URL</label>
              <input
                type="text"
                name="apiBaseUrl"
                value={formData.apiBaseUrl}
                onChange={handleChange}
                placeholder="https://max.openai365.top/v1"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.apiBaseUrl ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiBaseUrl && <p className="text-red-500 text-xs mt-1">{formErrors.apiBaseUrl}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">API Key</label>
              <input
                type="password"
                name="apiKey"
                value={formData.apiKey}
                onChange={handleChange}
                placeholder="sk-..."
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono outline-none ${formErrors.apiKey ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-gray-400'}`}
              />
              {formErrors.apiKey && <p className="text-red-500 text-xs mt-1">{formErrors.apiKey}</p>}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-indigo-900 to-gray-900 hover:from-black hover:to-black text-white font-bold py-3.5 rounded-xl shadow-lg transform transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin h-5 w-5" />
              <span>大师推演中(3-5分钟)</span>
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 text-amber-300" />
              <span>生成人生K线</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default BaziForm;
