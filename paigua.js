// 六爻排卦引擎
class PaiguaEngine {
    constructor() {
        console.log('排卦引擎初始化...');
    }
    
    // 生成完整的排卦结果
    generatePaigua(hexagram) {
        console.log('开始排卦，传入卦象数据:', hexagram);
        
        if (!hexagram || !hexagram.benGua) {
            console.error('卦象数据不完整，无法排卦');
            return this.createEmptyResult();
        }
        
        // 1. 查找卦象信息
        const guaData = this.findGuaData(hexagram);
        if (!guaData) {
            console.error('无法找到卦象数据');
            return this.createEmptyResult();
        }
        
        console.log('卦象查找结果:', guaData);
        
        // 2. 获取当前时间信息
        const currentDate = new Date();
        const dateInfo = this.getDateInfo(currentDate);
        
        // 3. 获取六神顺序
        const liuShen = this.getLiuShen(currentDate);
        
        const result = {
            guaInfo: guaData,
            dateInfo: dateInfo,
            liuShen: liuShen,
            changingYaos: hexagram.changingYaos || [],
            yaoData: [],
            shiYing: {
                shi: guaData.shiWei,
                ying: guaData.yingWei
            }
        };
        
        // 4. 为每一爻生成详细信息
        this.generateYaoData(result, hexagram, guaData);
        
        console.log('排卦完成，结果:', result);
        return result;
    }
    
    // 查找卦象数据
    findGuaData(hexagram) {
        try {
            const shangGuaBinary = hexagram.benGua.binary.slice(3, 6).join('');
            const xiaGuaBinary = hexagram.benGua.binary.slice(0, 3).join('');
            
            console.log('查找卦象:', {
                上卦: shangGuaBinary,
                下卦: xiaGuaBinary,
                上卦名: hexagram.benGua.shangGua,
                下卦名: hexagram.benGua.xiaGua
            });
            
            const guaData = hexagramDatabase.findHexagram(shangGuaBinary, xiaGuaBinary);
            
            if (!guaData || !guaData.name || guaData.name === '未知卦') {
                console.warn('卦象查找失败，尝试备用查找...');
                return this.findGuaDataFallback(hexagram);
            }
            
            return guaData;
        } catch (error) {
            console.error('查找卦象数据时出错:', error);
            return this.createDefaultGuaData(hexagram);
        }
    }
    
    // 备用卦象查找
    findGuaDataFallback(hexagram) {
        const shangGuaName = hexagram.benGua.shangGua;
        const xiaGuaName = hexagram.benGua.xiaGua;
        
        // 尝试在guaGongData中查找
        for (const [binary, data] of Object.entries(hexagramDatabase.guaGongData)) {
            if (data.name.includes(shangGuaName) && data.name.includes(xiaGuaName)) {
                console.log('备用查找成功:', data);
                return data;
            }
        }
        
        return this.createDefaultGuaData(hexagram);
    }
    
    // 创建默认卦象数据
    createDefaultGuaData(hexagram) {
        return {
            name: `${hexagram.benGua.shangGua}上${hexagram.benGua.xiaGua}下`,
            number: 0,
            guaGong: '乾',
            shiWei: 1,
            yingWei: 4,
            wuXing: '金'
        };
    }
    
    // 获取日期信息
    getDateInfo(date) {
        try {
            const lunarDate = this.getLunarDate(date);
            const yueJian = this.getYueJian(lunarDate.month);
            const riChen = this.getRiChen(date);
            
            return {
                solarDate: date,
                lunarDate: lunarDate,
                yueJian: yueJian,
                riChen: riChen,
                yueWuXing: this.getDiZhiWuXing(yueJian),
                riWuXing: this.getDiZhiWuXing(riChen)
            };
        } catch (error) {
            console.error('获取日期信息时出错:', error);
            return {
                solarDate: date,
                lunarDate: { year: '未知', month: '正月', day: 1 },
                yueJian: '寅',
                riChen: '子',
                yueWuXing: '木',
                riWuXing: '水'
            };
        }
    }
    
    // 获取农历日期（简化版）
    getLunarDate(date) {
        const solarMonth = date.getMonth() + 1;
        const solarDay = date.getDate();
        
        // 简化：直接使用公历月份作为农历月份
        const lunarMonths = [
            '正月', '二月', '三月', '四月', '五月', '六月',
            '七月', '八月', '九月', '十月', '冬月', '腊月'
        ];
        
        return {
            year: date.getFullYear(),
            month: lunarMonths[solarMonth - 1] || '正月',
            day: solarDay
        };
    }
    
    // 获取月建
    getYueJian(lunarMonth) {
        const yueJianMap = {
            '正月': '寅', '二月': '卯', '三月': '辰',
            '四月': '巳', '五月': '午', '六月': '未',
            '七月': '申', '八月': '酉', '九月': '戌',
            '十月': '亥', '冬月': '子', '腊月': '丑'
        };
        
        return yueJianMap[lunarMonth] || '寅';
    }
    
    // 获取日辰
    getRiChen(date) {
        const riChenList = [
            '子', '丑', '寅', '卯', '辰', '巳',
            '午', '未', '申', '酉', '戌', '亥'
        ];
        
        const dayOfMonth = date.getDate();
        const index = (dayOfMonth - 1) % 12;
        return riChenList[index] || '子';
    }
    
    // 获取地支五行
    getDiZhiWuXing(diZhi) {
        if (!diZhi || diZhi.length < 1) {
            console.warn('地支字符串为空:', diZhi);
            return '未知';
        }
        
        // 提取地支字符（处理"甲子"这样的字符串）
        const diZhiChar = diZhi.length > 1 ? diZhi.charAt(1) : diZhi.charAt(0);
        
        const wuXing = hexagramDatabase.diZhiWuXing[diZhiChar];
        if (!wuXing) {
            console.warn(`未找到地支"${diZhiChar}"的五行映射，完整地支: ${diZhi}`);
            return '未知';
        }
        
        return wuXing;
    }
    
    // 起六神
    getLiuShen(date) {
        try {
            const tianGan = this.getTianGan(date);
            return hexagramDatabase.getLiuShenOrder(tianGan);
        } catch (error) {
            console.error('获取六神时出错:', error);
            return ['青龙', '朱雀', '勾陈', '螣蛇', '白虎', '玄武'];
        }
    }
    
    // 获取天干
    getTianGan(date) {
        const gan = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
        const year = date.getFullYear();
        return gan[(year - 4) % 10] || '甲';
    }
    
    // 生成爻数据
    generateYaoData(result, hexagram, guaData) {
        const yaoCount = 6;
        
        for (let i = 0; i < yaoCount; i++) {
            try {
                const yaoPosition = i + 1; // 1=初爻, 6=上爻
                const yaoData = this.generateSingleYaoData(
                    yaoPosition, 
                    i, 
                    hexagram, 
                    guaData, 
                    result
                );
                
                result.yaoData.push(yaoData);
            } catch (error) {
                console.error(`生成第${i + 1}爻数据时出错:`, error);
                result.yaoData.push(this.createEmptyYaoData(i + 1));
            }
        }
    }
    
    // 生成单个爻数据
    generateSingleYaoData(position, index, hexagram, guaData, result) {
        // 爻的基本信息
        const yaoPosition = position;
        const isNeiGua = index < 3; // 0-2为内卦，3-5为外卦
        const isYang = hexagram.benGua.binary[5 - index] === 1;
        const isChanging = result.changingYaos.includes(position);
        
        // 1. 获取纳甲地支
        const dizhi = this.getNaJiaDiZhi(position, isNeiGua, guaData);
        
        // 2. 提取地支字符
        const diZhiChar = this.extractDiZhiChar(dizhi);
        
        // 3. 获取地支五行
        const diZhiWuXing = this.getDiZhiWuXing(diZhiChar);
        
        // 4. 定六亲
        const liuQin = this.getLiuQin(guaData.wuXing, diZhiWuXing);
        
        // 5. 安世应
        const shiYing = this.getShiYingMark(position, result.shiYing.shi, result.shiYing.ying);
        
        // 6. 起六神
        const liuShen = result.liuShen[index] || '未知';
        
        // 7. 分析旺衰
        const wangShuai = this.analyzeWangShuai(diZhiWuXing, result.dateInfo);
        
        return {
            position: yaoPosition,
            positionName: this.getYaoPositionName(yaoPosition),
            isYang: isYang,
            symbol: this.getYaoSymbol(isYang, isChanging),
            dizhi: dizhi,
            diZhiChar: diZhiChar,
            diZhiWuXing: diZhiWuXing,
            liuQin: liuQin,
            shiYing: shiYing,
            liuShen: liuShen,
            wangShuai: wangShuai,
            isChanging: isChanging,
            isNeiGua: isNeiGua
        };
    }
    
    // 获取纳甲地支
    getNaJiaDiZhi(position, isNeiGua, guaData) {
        try {
            const guaGong = guaData.guaGong;
            const yaoIndex = isNeiGua ? (position - 1) : (position - 4);
            
            if (yaoIndex < 0 || yaoIndex > 2) {
                console.warn(`爻位索引错误: position=${position}, isNeiGua=${isNeiGua}, yaoIndex=${yaoIndex}`);
                return '未知';
            }
            
            const dizhi = hexagramDatabase.getNaJiaDiZhi(guaGong, isNeiGua, yaoIndex);
            
            if (!dizhi || dizhi === '未知') {
                console.warn(`纳甲地支获取失败: guaGong=${guaGong}, isNeiGua=${isNeiGua}, yaoIndex=${yaoIndex}`);
                return this.getDefaultDiZhi(position, isNeiGua);
            }
            
            return dizhi;
        } catch (error) {
            console.error('获取纳甲地支时出错:', error);
            return this.getDefaultDiZhi(position, isNeiGua);
        }
    }
    
    // 获取默认地支
    getDefaultDiZhi(position, isNeiGua) {
        const defaultDiZhi = {
            1: '子', 2: '丑', 3: '寅',
            4: '卯', 5: '辰', 6: '巳'
        };
        
        return isNeiGua ? 
            `甲${defaultDiZhi[position]}` : 
            `壬${defaultDiZhi[position]}`;
    }
    
    // 提取地支字符
    extractDiZhiChar(dizhi) {
        if (!dizhi || dizhi === '未知') {
            return '子';
        }
        
        // 从"甲子"中提取"子"
        if (dizhi.length >= 2) {
            return dizhi.charAt(1);
        }
        
        return dizhi;
    }
    
    // 定六亲
    getLiuQin(guaWuXing, yaoWuXing) {
        try {
            if (!guaWuXing || !yaoWuXing || guaWuXing === '未知' || yaoWuXing === '未知') {
                return '未知';
            }
            
            return hexagramDatabase.getLiuQinRelation(guaWuXing, yaoWuXing);
        } catch (error) {
            console.error('计算六亲时出错:', error, {guaWuXing, yaoWuXing});
            return '未知';
        }
    }
    
    // 安世应标记
    getShiYingMark(position, shiWei, yingWei) {
        if (position === shiWei) return '世';
        if (position === yingWei) return '应';
        return '';
    }
    
    // 获取爻位名称
    getYaoPositionName(position) {
        const positionNames = {
            1: '初爻',
            2: '二爻',
            3: '三爻',
            4: '四爻',
            5: '五爻',
            6: '上爻'
        };
        return positionNames[position] || `第${position}爻`;
    }
    
    // 获取爻象符号
    getYaoSymbol(isYang, isChanging) {
        if (isChanging) {
            return isYang ? '老阳' : '老阴';
        }
        return isYang ? '少阳' : '少阴';
    }
    
    // 分析旺衰
    analyzeWangShuai(yaoWuXing, dateInfo) {
        try {
            if (!yaoWuXing || yaoWuXing === '未知' || !dateInfo) {
                return {
                    yueState: '平',
                    riState: '平',
                    overall: '平'
                };
            }
            
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
        } catch (error) {
            console.error('分析旺衰时出错:', error);
            return {
                yueState: '平',
                riState: '平',
                overall: '平'
            };
        }
    }
    
    // 获取五行状态
    getWuXingState(yaoWuXing, targetWuXing) {
        if (yaoWuXing === targetWuXing) return '旺';
        
        const shengMap = {
            '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
        };
        
        const keMap = {
            '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
        };
        
        if (shengMap[yaoWuXing] === targetWuXing) return '相';
        if (keMap[yaoWuXing] === targetWuXing) return '死';
        if (shengMap[targetWuXing] === yaoWuXing) return '休';
        if (keMap[targetWuXing] === yaoWuXing) return '囚';
        
        return '平';
    }
    
    // 创建空的排卦结果
    createEmptyResult() {
        return {
            guaInfo: {
                name: '未知卦',
                number: 0,
                guaGong: '未知',
                shiWei: 0,
                yingWei: 0,
                wuXing: '未知'
            },
            dateInfo: {
                yueJian: '未知',
                riChen: '未知',
                yueWuXing: '未知',
                riWuXing: '未知'
            },
            yaoData: [],
            shiYing: { shi: 0, ying: 0 },
            liuShen: ['未知', '未知', '未知', '未知', '未知', '未知'],
            changingYaos: []
        };
    }
    
    // 创建空的爻数据
    createEmptyYaoData(position) {
        return {
            position: position,
            positionName: this.getYaoPositionName(position),
            isYang: false,
            symbol: '未知',
            dizhi: '未知',
            diZhiChar: '子',
            diZhiWuXing: '未知',
            liuQin: '未知',
            shiYing: '',
            liuShen: '未知',
            wangShuai: { overall: '平' },
            isChanging: false,
            isNeiGua: position <= 3
        };
    }
    
    // 数据验证
    validateResult(result) {
        if (!result) {
            console.error('排卦结果为空');
            return false;
        }
        
        if (!result.yaoData || result.yaoData.length !== 6) {
            console.error('爻数据不完整，数量:', result.yaoData?.length);
            return false;
        }
        
        // 检查每个爻的关键数据
        for (let i = 0; i < result.yaoData.length; i++) {
            const yao = result.yaoData[i];
            if (!yao.dizhi || yao.dizhi === '未知') {
                console.warn(`第${i + 1}爻地支数据缺失`);
            }
            if (!yao.liuQin || yao.liuQin === '未知') {
                console.warn(`第${i + 1}爻六亲数据缺失`);
            }
        }
        
        return true;
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