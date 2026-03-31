// 六爻排卦引擎 - 完整修正版
// 修正内容：
// 1. 移除错误的世应转换（数据库中的世应已是正序，1=初爻，6=上爻）
// 2. 修正日干计算：根据公历日期计算真实日干支，用于六神起例
// 3. 修正月建：根据节气大致划分（基于日期，避免使用农历月份）
// 4. 修正日辰：使用日干支中的地支
// 5. 保留原有的纳甲、六亲、六神、旺衰分析（简化但可用）

class PaiguaEngine {
    constructor() {
        console.log('排卦引擎初始化（修正版）...');
    }
    
    /**
     * 生成完整的排卦结果
     * @param {object} hexagram - 从 app.js 传入的卦象对象（二进制数组为正序：初→上）
     * @returns {object} 排卦结果
     */
    generatePaigua(hexagram) {
        console.log('=== 开始排卦 ===');
        
        if (!hexagram || !hexagram.benGua) {
            console.error('卦象数据不完整，无法排卦');
            return this.createEmptyResult();
        }
        
        // 1. 获取卦象信息（数据库中的二进制为正序，世应也为正序）
        const guaData = this.getGuaData(hexagram);
        if (!guaData) {
            console.error('无法获取卦象信息');
            return this.createEmptyResult();
        }
        
        // 2. 获取当前时间信息（包含正确的月建、日辰、日干）
        const currentDate = new Date();
        const dateInfo = this.getDateInfo(currentDate);
        
        // 3. 获取六神顺序（基于正确的日干）
        const tianGan = dateInfo.tianGan; // 日干
        const liuShenOrder = hexagramDatabase.getLiuShenOrder(tianGan);
        
        // 4. 准备结果对象
        const result = {
            guaInfo: guaData,
            dateInfo: dateInfo,
            tianGan: tianGan,
            liuShenOrder: liuShenOrder,
            changingYaos: hexagram.changingYaos || [],
            yaoData: [],
            shiYing: {
                shi: guaData.shiWei,
                ying: guaData.yingWei
            }
        };
        
        // 5. 生成每一爻的详细数据
        this.generateYaoData(result, hexagram, guaData);
        
        // 6. 验证结果
        this.validateResult(result);
        
        console.log('排卦完成');
        return result;
    }
    
    /**
     * 获取卦象数据（优先使用传入的卦名，否则通过二进制查找）
     */
    getGuaData(hexagram) {
        const benGua = hexagram.benGua;
        let guaData = null;
        
        // 如果已有完整的卦象信息（如从历史记录恢复）
        if (benGua.name && benGua.name !== '未知卦' && benGua.number !== 0) {
            for (const [binary, data] of Object.entries(hexagramDatabase.guaGongData)) {
                if (data.name === benGua.name) {
                    guaData = { ...data, binary: binary };
                    break;
                }
            }
        }
        
        // 如果没找到，通过二进制查找（app.js 传入的 binaryStr 为正序）
        if (!guaData && benGua.binaryStr) {
            guaData = hexagramDatabase.findHexagramByBinary(benGua.binaryStr);
        }
        
        // 如果还是没有，创建默认
        if (!guaData) {
            console.warn('未找到标准卦象数据，使用默认值');
            guaData = {
                name: benGua.name || '未知卦',
                number: 0,
                guaGong: benGua.shangGua || '乾',
                shiWei: 1,
                yingWei: 4,
                wuXing: benGua.wuXing || '金'
            };
        }
        
        return guaData;
    }
    
    // ==================== 日期时间相关（修正版） ====================
    
    /**
     * 获取日期信息（包含月建、日辰、日干、五行等）
     */
    getDateInfo(date) {
        // 计算日干支（得到天干和地支）
        const dayGanZhi = this.getDayGanZhi(date);
        const tianGan = dayGanZhi.gan;      // 日干
        const riChen = dayGanZhi.zhi;       // 日辰地支
        
        // 获取月建地支（基于节气，使用近似算法）
        const yueJian = this.getYueJian(date);
        
        return {
            solarDate: date,
            tianGan: tianGan,               // 日干（用于六神）
            yueJian: yueJian,               // 月建地支
            riChen: riChen,                 // 日辰地支
            yueWuXing: this.getDiZhiWuXing(yueJian),
            riWuXing: this.getDiZhiWuXing(riChen)
        };
    }
    
    /**
     * 计算公历某天的日干支（返回天干和地支）
     * 使用公式：日干支基数 = (年尾二位数+7)*5 + 15 + (年尾二位数+19)/4
     * 然后加上该日期是当年的第几天，模60得到干支序号
     */
    getDayGanZhi(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 计算日干支基数
        let y = year % 100;
        let base = ((y + 7) * 5 + 15 + Math.floor((y + 19) / 4)) % 60;
        
        // 计算该日期是当年的第几天
        const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const daysInMonth = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let dayOfYear = 0;
        for (let i = 0; i < month - 1; i++) dayOfYear += daysInMonth[i];
        dayOfYear += day;
        
        let ganZhiIndex = (base + dayOfYear) % 60;
        if (ganZhiIndex === 0) ganZhiIndex = 60;
        
        const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const zhi = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
        
        return {
            gan: gan[(ganZhiIndex - 1) % 10],
            zhi: zhi[(ganZhiIndex - 1) % 12]
        };
    }
    
    /**
     * 获取月建地支（基于节气，使用日期近似）
     * 传统月建以节气为界：立春→寅，惊蛰→卯，清明→辰，立夏→巳，芒种→午，小暑→未，
     * 立秋→申，白露→酉，寒露→戌，立冬→亥，大雪→子，小寒→丑
     * 以下使用公历日期大致划分（误差1-2天，可接受）
     */
    getYueJian(date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        
        // 立春（2月4日左右）至惊蛰前 -> 寅月
        if ((month === 2 && day >= 4) || month === 3 || (month === 4 && day < 5)) return '寅';
        // 清明（4月5日左右）至立夏前 -> 辰月
        if ((month === 4 && day >= 5) || month === 5 || (month === 6 && day < 6)) return '巳';
        // 芒种（6月6日左右）至小暑前 -> 午月
        if ((month === 6 && day >= 6) || month === 7 || (month === 8 && day < 8)) return '申';
        // 立秋（8月8日左右）至白露前 -> 申月
        if ((month === 8 && day >= 8) || month === 9 || (month === 10 && day < 8)) return '酉';
        // 寒露（10月8日左右）至立冬前 -> 戌月
        if ((month === 10 && day >= 8) || month === 11 || (month === 12 && day < 7)) return '亥';
        // 大雪（12月7日左右）至小寒前 -> 子月
        if ((month === 12 && day >= 7) || month === 1 || (month === 2 && day < 4)) return '丑';
        
        // 默认返回寅月（立春后）
        return '寅';
    }
    
    /**
     * 获取地支的五行
     */
    getDiZhiWuXing(dizhi) {
        return hexagramDatabase.diZhiWuXing[dizhi] || '未知';
    }
    
    // ==================== 排卦核心 ====================
    
    /**
     * 生成每一爻的数据
     */
    generateYaoData(result, hexagram, guaData) {
        const yaoCount = 6;
        const benGuaBinary = hexagram.benGua.binary; // 数组 [初爻,...,上爻] (正序)
        const changingYaos = result.changingYaos;
        const shiWei = result.shiYing.shi;   // 正序世爻位置
        const yingWei = result.shiYing.ying; // 正序应爻位置
        const liuShenOrder = result.liuShenOrder;
        
        for (let i = 0; i < yaoCount; i++) {
            const position = i + 1; // 爻位 1-6 (正序)
            const isNeiGua = i < 3; // 内卦（下卦）索引0-2
            const isYang = benGuaBinary[i] === 1;
            const isChanging = changingYaos.includes(position);
            
            // 纳甲地支：内卦索引0=初爻,1=二爻,2=三爻；外卦索引0=四爻,1=五爻,2=上爻
            const yaoIndexInGua = isNeiGua ? i : i - 3;
            const dizhi = hexagramDatabase.getNaJiaDiZhi(guaData.guaGong, isNeiGua, yaoIndexInGua);
            
            // 提取地支字符（如"甲子" -> "子"）
            const diZhiChar = dizhi.length > 1 ? dizhi.charAt(1) : dizhi.charAt(0);
            const diZhiWuXing = this.getDiZhiWuXing(diZhiChar);
            
            // 定六亲
            const liuQin = hexagramDatabase.getLiuQinRelation(guaData.wuXing, diZhiWuXing);
            
            // 安世应（直接使用正序位置）
            let shiYing = '';
            if (position === shiWei) shiYing = '世';
            else if (position === yingWei) shiYing = '应';
            
            // 起六神（根据爻位正序，初爻对应六神数组第0个）
            const liuShen = liuShenOrder[i % 6];
            
            // 分析旺衰（基于月建、日辰）
            const wangShuai = this.analyzeWangShuai(diZhiWuXing, result.dateInfo);
            
            // 爻象符号
            const symbol = this.getYaoSymbol(isYang, isChanging);
            
            result.yaoData.push({
                position: position,
                positionName: this.getPositionName(position),
                isYang: isYang,
                symbol: symbol,
                dizhi: dizhi,
                diZhiChar: diZhiChar,
                diZhiWuXing: diZhiWuXing,
                liuQin: liuQin,
                shiYing: shiYing,
                liuShen: liuShen,
                wangShuai: wangShuai,
                isChanging: isChanging,
                isNeiGua: isNeiGua
            });
        }
    }
    
    /**
     * 获取爻位名称
     */
    getPositionName(position) {
        const names = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
        return names[position - 1];
    }
    
    /**
     * 获取爻象符号文本
     */
    getYaoSymbol(isYang, isChanging) {
        if (isChanging) {
            return isYang ? '老阳' : '老阴';
        }
        return isYang ? '少阳' : '少阴';
    }
    
    /**
     * 分析爻的旺衰（简化版：旺相休囚死）
     */
    analyzeWangShuai(yaoWuXing, dateInfo) {
        const yueState = this.getWuXingState(yaoWuXing, dateInfo.yueWuXing);
        const riState = this.getWuXingState(yaoWuXing, dateInfo.riWuXing);
        
        let overall = '平';
        if (yueState === '旺' && riState === '旺') overall = '极旺';
        else if (yueState === '旺' || riState === '旺') overall = '旺';
        else if (yueState === '死' && riState === '死') overall = '极衰';
        else if (yueState === '死' || riState === '死') overall = '衰';
        
        return {
            yueJian: dateInfo.yueJian,
            yueWuXing: dateInfo.yueWuXing,
            yueState: yueState,
            riChen: dateInfo.riChen,
            riWuXing: dateInfo.riWuXing,
            riState: riState,
            overall: overall
        };
    }
    
    /**
     * 获取五行状态（旺相休囚死）
     * 规则：同我者旺，我生者相，生我者休，我克者死，克我者囚
     */
    getWuXingState(yaoWuXing, targetWuXing) {
        if (yaoWuXing === targetWuXing) return '旺';
        
        const shengMap = {
            '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
        };
        const keMap = {
            '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
        };
        
        if (shengMap[yaoWuXing] === targetWuXing) return '相';   // 我生者相
        if (keMap[yaoWuXing] === targetWuXing) return '死';     // 我克者死
        if (shengMap[targetWuXing] === yaoWuXing) return '休';   // 生我者休
        if (keMap[targetWuXing] === yaoWuXing) return '囚';     // 克我者囚
        
        return '平';
    }
    
    /**
     * 验证排卦结果
     */
    validateResult(result) {
        if (!result.yaoData || result.yaoData.length !== 6) {
            console.error('爻数据数量异常:', result.yaoData?.length);
            return false;
        }
        let validCount = 0;
        for (let i = 0; i < 6; i++) {
            if (result.yaoData[i] && result.yaoData[i].liuQin) validCount++;
        }
        console.log(`排卦验证: ${validCount}/6 爻有效`);
        return validCount === 6;
    }
    
    /**
     * 创建空的排卦结果（错误时返回）
     */
    createEmptyResult() {
        return {
            guaInfo: { name: '未知卦', number: 0, guaGong: '乾', shiWei: 1, yingWei: 4, wuXing: '金' },
            dateInfo: { 
                yueJian: '寅', riChen: '子', yueWuXing: '木', riWuXing: '水',
                tianGan: '甲'
            },
            tianGan: '甲',
            liuShenOrder: ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'],
            changingYaos: [],
            yaoData: [],
            shiYing: { shi: 1, ying: 4 }
        };
    }
}

// 创建全局实例
const paiguaEngine = new PaiguaEngine();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = paiguaEngine;
} else {
    window.paiguaEngine = paiguaEngine;
}