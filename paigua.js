// 六爻排卦引擎 - 修复版
class PaiguaEngine {
    constructor() {
        console.log('排卦引擎初始化...');
    }
    
    // 生成完整的排卦结果
    generatePaigua(hexagram) {
        console.log('=== 开始排卦 ===');
        console.log('传入卦象数据:', hexagram);
        
        if (!hexagram || !hexagram.benGua) {
            console.error('卦象数据不完整，无法排卦');
            return this.createEmptyResult();
        }
        
        // 1. 查找卦象信息
        const guaData = this.findGuaDataWithChange(hexagram);
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
        
        // 5. 验证结果
        this.validateResult(result);
        
        console.log('排卦完成，结果:', result);
        return result;
    }
    
    // ==================== 修复方案一：增强卦象查找的健壮性 ====================
    
    // 主查找函数（增强版）
    findGuaDataWithChange(hexagram) {
        try {
            // 确保二进制数组长度正确
            const shangGuaBinary = this.ensureBinaryLength(
                hexagram.benGua.binary.slice(3, 6), 
                3
            ).join('');
            
            const xiaGuaBinary = this.ensureBinaryLength(
                hexagram.benGua.binary.slice(0, 3), 
                3
            ).join('');
            
            console.log('查找卦象参数:', {
                上卦: shangGuaBinary,
                下卦: xiaGuaBinary,
                上卦名: hexagram.benGua.shangGua,
                下卦名: hexagram.benGua.xiaGua,
                二进制数组: hexagram.benGua.binary
            });
            
            // 使用数据库查找
            let guaData = hexagramDatabase.findHexagram(shangGuaBinary, xiaGuaBinary);
            
            // 如果查找失败，尝试备用方案
            if (!guaData || !guaData.name || guaData.name === '未知卦') {
                console.warn('主查找失败，尝试备用查找...');
                guaData = this.backupFindGuaData(hexagram);
            }
            
            // 确保返回有效数据
            return guaData || this.createDefaultGuaData(hexagram);
        } catch (error) {
            console.error('卦象查找过程中出错:', error);
            return this.createDefaultGuaData(hexagram);
        }
    }
    
    // 辅助函数：确保二进制数组长度
    ensureBinaryLength(binaryArray, expectedLength) {
        if (!binaryArray || !Array.isArray(binaryArray)) {
            console.warn(`二进制数组无效，返回默认数组:`, binaryArray);
            return new Array(expectedLength).fill(0);
        }
        
        if (binaryArray.length === 0) {
            return new Array(expectedLength).fill(0);
        }
        
        if (binaryArray.length < expectedLength) {
            // 补全到预期长度
            const paddedArray = [...binaryArray];
            while (paddedArray.length < expectedLength) {
                paddedArray.push(0);
            }
            console.warn(`二进制数组长度不足 ${binaryArray.length}/${expectedLength}，已补全`);
            return paddedArray;
        }
        
        if (binaryArray.length > expectedLength) {
            // 截取到预期长度
            console.warn(`二进制数组过长 ${binaryArray.length}/${expectedLength}，已截取`);
            return binaryArray.slice(0, expectedLength);
        }
        
        return binaryArray;
    }
    
    // 备用查找函数
    backupFindGuaData(hexagram) {
        const shangGuaName = hexagram.benGua.shangGua;
        const xiaGuaName = hexagram.benGua.xiaGua;
        
        console.log('备用查找参数:', { shangGuaName, xiaGuaName });
        
        // 方法1：遍历所有卦象，查找名称匹配的
        for (const [binary, data] of Object.entries(hexagramDatabase.guaGongData)) {
            if (data.name && data.name.includes(shangGuaName) && data.name.includes(xiaGuaName)) {
                console.log('备用查找成功（遍历法）:', data);
                return data;
            }
        }
        
        // 方法2：尝试组合卦名查找
        const possibleName1 = `${shangGuaName}${xiaGuaName}`;
        const possibleName2 = `${shangGuaName}为${xiaGuaName}`;
        const possibleName3 = `${shangGuaName}上${xiaGuaName}下`;
        
        for (const [binary, data] of Object.entries(hexagramDatabase.guaGongData)) {
            if (data.name === possibleName1 || 
                data.name === possibleName2 || 
                data.name === possibleName3) {
                console.log('备用查找成功（组合名法）:', data);
                return data;
            }
        }
        
        console.warn('所有备用查找方法都失败，使用默认卦象数据');
        return this.createDefaultGuaData(hexagram);
    }
    
    // 创建默认卦象数据
    createDefaultGuaData(hexagram) {
        return {
            name: `${hexagram.benGua.shangGua || '未知'}上${hexagram.benGua.xiaGua || '未知'}下`,
            number: 0,
            guaGong: hexagram.benGua.shangGua || '乾',
            shiWei: 1,
            yingWei: 4,
            wuXing: hexagramDatabase.naJiaMap[hexagram.benGua.shangGua]?.wuXing || '金'
        };
    }
    
    // ==================== 基础数据获取函数 ====================
    
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
        if (!diZhi || typeof diZhi !== 'string') {
            console.warn('地支参数无效:', diZhi);
            return '未知';
        }
        
        // 提取地支字符（处理"甲子"这样的字符串）
        const diZhiChar = diZhi.length > 1 ? diZhi.charAt(1) : diZhi.charAt(0);
        
        if (!diZhiChar) {
            console.warn(`无法从地支字符串"${diZhi}"中提取字符`);
            return '未知';
        }
        
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
    
    // ==================== 修复方案二：增强爻数据生成的健壮性 ====================
    
    // 生成爻数据
    generateYaoData(result, hexagram, guaData) {
        const yaoCount = 6;
        result.yaoData = []; // 先清空，防止重复
        
        console.log('开始生成爻数据，卦象信息:', {
            卦名: guaData.name,
            卦宫: guaData.guaGong,
            五行: guaData.wuXing
        });
        
        for (let i = 0; i < yaoCount; i++) {
            try {
                const yaoPosition = i + 1;
                
                // 验证 hexagram.benGua.binary 存在且长度足够
                if (!hexagram.benGua.binary || !Array.isArray(hexagram.benGua.binary)) {
                    console.error(`hexagram.benGua.binary 数据异常，位置 ${i}`);
                    result.yaoData.push(this.createSafeYaoData(yaoPosition, i, result, hexagram));
                    continue;
                }
                
                // 确保二进制数组长度
                const binaryArray = this.ensureBinaryLength(hexagram.benGua.binary, 6);
                
                const yaoData = this.generateSingleYaoData(
                    yaoPosition, 
                    i, 
                    binaryArray,
                    hexagram, 
                    guaData, 
                    result
                );
                
                result.yaoData.push(yaoData);
                
                console.log(`第${yaoPosition}爻生成完成:`, {
                    位置: yaoData.positionName,
                    地支: yaoData.dizhi,
                    六亲: yaoData.liuQin,
                    是否动爻: yaoData.isChanging
                });
            } catch (error) {
                console.error(`生成第${i + 1}爻数据时出错:`, error);
                result.yaoData.push(this.createSafeYaoData(i + 1, i, result, hexagram));
            }
        }
        
        // 验证生成的数据
        this.validateYaoData(result.yaoData);
    }
    
    // 生成单个爻数据
    generateSingleYaoData(position, index, binaryArray, hexagram, guaData, result) {
        // 爻的基本信息
        const yaoPosition = position;
        const isNeiGua = index < 3; // 0-2为内卦，3-5为外卦
        
        // 注意：二进制数组是从上爻开始的，所以需要倒序
        const binaryIndex = 5 - index; // 0=上爻, 5=初爻
        const isYang = binaryArray[binaryIndex] === 1;
        
        const isChanging = result.changingYaos && 
                          Array.isArray(result.changingYaos) && 
                          result.changingYaos.includes(position);
        
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
            
            if (!guaGong || !hexagramDatabase.naJiaMap[guaGong]) {
                console.warn(`卦宫"${guaGong}"不在纳甲映射表中`);
                return this.getDefaultDiZhi(position, isNeiGua);
            }
            
            const yaoIndex = isNeiGua ? (position - 1) : (position - 4);
            
            if (yaoIndex < 0 || yaoIndex > 2) {
                console.warn(`爻位索引错误: position=${position}, isNeiGua=${isNeiGua}, yaoIndex=${yaoIndex}`);
                return this.getDefaultDiZhi(position, isNeiGua);
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
        const defaultDiZhiMap = {
            1: '子', 2: '丑', 3: '寅',
            4: '卯', 5: '辰', 6: '巳'
        };
        
        const diZhiChar = defaultDiZhiMap[position] || '子';
        const tianGan = isNeiGua ? '甲' : '壬';
        
        return `${tianGan}${diZhiChar}`;
    }
    
    // 提取地支字符
    extractDiZhiChar(dizhi) {
        if (!dizhi || typeof dizhi !== 'string') {
            console.warn('地支字符串无效:', dizhi);
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
            if (!guaWuXing || !yaoWuXing || 
                guaWuXing === '未知' || yaoWuXing === '未知') {
                console.warn('五行参数无效:', { guaWuXing, yaoWuXing });
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
    
    // ==================== 修复方案三：数据验证和错误处理 ====================
    
    // 创建安全的爻数据（兜底函数）
    createSafeYaoData(position, index, result, hexagram) {
        const isNeiGua = index < 3;
        const binaryArray = hexagram && hexagram.benGua && hexagram.benGua.binary ? 
                           this.ensureBinaryLength(hexagram.benGua.binary, 6) : 
                           [0, 0, 0, 0, 0, 0];
        
        const binaryIndex = 5 - index;
        const isYang = binaryArray[binaryIndex] === 1;
        const isChanging = result.changingYaos && 
                          Array.isArray(result.changingYaos) && 
                          result.changingYaos.includes(position);
        
        return {
            position: position,
            positionName: this.getYaoPositionName(position),
            isYang: isYang,
            symbol: this.getYaoSymbol(isYang, isChanging),
            dizhi: this.getDefaultDiZhi(position, isNeiGua),
            diZhiChar: '子',
            diZhiWuXing: '水',
            liuQin: '未知',
            shiYing: '',
            liuShen: result.liuShen[index] || '未知',
            wangShuai: { overall: '平' },
            isChanging: isChanging,
            isNeiGua: isNeiGua
        };
    }
    
    // 验证爻数据
    validateYaoData(yaoData) {
        if (!yaoData || !Array.isArray(yaoData)) {
            console.error('爻数据无效:', yaoData);
            return false;
        }
        
        if (yaoData.length !== 6) {
            console.error(`爻数据数量异常: ${yaoData.length}/6`);
            return false;
        }
        
        let validCount = 0;
        for (let i = 0; i < yaoData.length; i++) {
            const yao = yaoData[i];
            if (yao && yao.positionName && yao.dizhi) {
                validCount++;
            } else {
                console.warn(`第${i + 1}爻数据不完整:`, yao);
            }
        }
        
        console.log(`爻数据验证: ${validCount}/6 条有效`);
        return validCount === 6;
    }
    
    // 验证整个排卦结果
    validateResult(result) {
        if (!result) {
            console.error('排卦结果为空');
            return false;
        }
        
        if (!result.yaoData || result.yaoData.length !== 6) {
            console.error(`爻数据数量异常: ${result.yaoData ? result.yaoData.length : 0}/6`);
            return false;
        }
        
        if (!result.guaInfo || !result.guaInfo.name) {
            console.warn('卦象信息不完整');
        }
        
        return true;
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
}

// 创建全局实例
const paiguaEngine = new PaiguaEngine();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = paiguaEngine;
} else {
    window.paiguaEngine = paiguaEngine;
}