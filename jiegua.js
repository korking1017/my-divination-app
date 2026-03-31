// 六爻解卦引擎 - 完整版
// 负责：用神分析、动爻分析、世应分析、五行生克、综合解读

class JieGuaEngine {
    constructor() {
        // 用神映射（根据不同问题类型）
        this.yongShenMap = {
            'wealth': '妻财',
            'career': '官鬼',
            'relationship': '妻财',   // 实际会根据性别调整
            'health': '官鬼',
            'exam': '父母',
            'others': '应爻'
        };
        
        // 六神含义
        this.liuShenMeanings = {
            '青龙': '主喜庆、吉祥、财运、姻缘',
            '朱雀': '主口舌、文书、消息、官非',
            '勾陈': '主田土、房产、牢狱、慢性病',
            '螣蛇': '主虚惊、怪异、变化、小人',
            '白虎': '主凶丧、血光、伤病、官非',
            '玄武': '主盗贼、阴私、欺骗、暧昧'
        };
        
        // 六亲含义（简要）
        this.liuQinMeanings = {
            '父母': '庇护、文书、学业、长辈',
            '兄弟': '竞争、阻碍、朋友、同辈',
            '妻财': '财富、妻子、物资、利益',
            '官鬼': '官职、事业、疾病、丈夫',
            '子孙': '晚辈、福神、医药、平安'
        };
    }
    
    /**
     * 生成解卦结果
     * @param {object} hexagram - 卦象对象
     * @param {object} paiguaResult - 排卦结果（已含正序世应）
     * @param {string} questionType - 问事类型
     * @param {string} gender - 性别 'male'/'female'
     * @returns {object} 解卦结果
     */
    generateInterpretation(hexagram, paiguaResult, questionType, gender = 'male') {
        console.log('开始解卦...', { questionType, gender });
        
        // 如果没有排卦结果，尝试用简化方式
        if (!paiguaResult || !paiguaResult.yaoData || paiguaResult.yaoData.length !== 6) {
            return this.generateSimpleInterpretation(hexagram, questionType, gender);
        }
        
        // 确定用神（根据问题类型和性别）
        let yongShenType = this.yongShenMap[questionType] || '应爻';
        if (questionType === 'relationship') {
            yongShenType = gender === 'male' ? '妻财' : '官鬼';
        }
        
        // 分析用神
        const yongShenAnalysis = this.analyzeYongShen(paiguaResult, yongShenType);
        
        // 分析动爻
        const changingYaoAnalysis = this.analyzeChangingYaos(hexagram, paiguaResult);
        
        // 分析世应关系
        const shiYingAnalysis = this.analyzeShiYing(paiguaResult);
        
        // 分析五行生克（整体）
        const wuXingAnalysis = this.analyzeWuXing(paiguaResult);
        
        // 获取卦辞
        const guaText = hexagramDatabase.getHexagramText(paiguaResult.guaInfo.number);
        
        // 生成总体解读
        const overall = this.generateOverallInterpretation(
            guaText,
            yongShenAnalysis,
            changingYaoAnalysis.hasChanging,
            shiYingAnalysis
        );
        
        // 生成建议
        const advice = this.generateAdvice(yongShenAnalysis, changingYaoAnalysis, shiYingAnalysis);
        
        return {
            questionType: questionType,
            yongShenType: yongShenType,
            overall: overall,
            yongShen: yongShenAnalysis.text,
            wuXing: wuXingAnalysis,
            shiYing: shiYingAnalysis.text,
            changingYaos: changingYaoAnalysis.text,
            guaText: guaText,
            advice: advice
        };
    }
    
    /**
     * 简化解卦（无排卦结果时使用）
     */
    generateSimpleInterpretation(hexagram, questionType, gender) {
        const benGua = hexagram.benGua;
        const changingCount = hexagram.changingYaos?.length || 0;
        const bianGua = hexagram.bianGua;
        
        let overall = `卦象为《${benGua.name}》。`;
        overall += `卦辞：${benGua.guaText || '暂无'}。`;
        overall += `解读：${benGua.explanation || '暂无'}。`;
        
        if (changingCount > 0) {
            overall += `有${changingCount}个动爻，变卦为《${bianGua?.name || '未知'}》。`;
        } else {
            overall += '此为静卦，事体平稳。';
        }
        
        const advice = '由于排卦数据不完整，无法进行详细分析。建议重新起卦或确保排卦引擎正常工作。';
        
        return {
            questionType: questionType,
            yongShenType: this.yongShenMap[questionType] || '应爻',
            overall: overall,
            yongShen: '数据不足，无法详细分析用神',
            wuXing: '五行分析需要排卦数据',
            shiYing: '世应分析需要排卦数据',
            changingYaos: changingCount > 0 ? `${changingCount}个动爻` : '无动爻',
            guaText: { text: benGua.guaText, explanation: benGua.explanation },
            advice: advice
        };
    }
    
    /**
     * 分析用神
     */
    analyzeYongShen(paiguaResult, yongShenType) {
        const yaos = paiguaResult.yaoData;
        const yongShenYaos = yaos.filter(yao => yao.liuQin === yongShenType);
        
        let text = `所问之事以“${yongShenType}”为用神。\n`;
        
        if (yongShenYaos.length === 0) {
            text += '⚠️ 卦中无用神，需看伏神或考虑代用。\n';
            return { text, strength: '弱', yaos: [] };
        }
        
        text += `卦中有${yongShenYaos.length}处用神：\n`;
        let strongestYao = null;
        let maxStrength = 0;
        
        yongShenYaos.forEach(yao => {
            const strength = this.calculateYaoStrength(yao);
            text += `• 第${yao.position}爻（${yao.positionName}）${yao.dizhi} ${yao.liuQin}：${yao.wangShuai.overall}，${yao.liuShen}主事\n`;
            if (strength > maxStrength) {
                maxStrength = strength;
                strongestYao = yao;
            }
        });
        
        let strengthText = '';
        if (maxStrength >= 8) strengthText = '强旺有力，事易成';
        else if (maxStrength >= 5) strengthText = '平和中正，事可谋';
        else strengthText = '衰弱无力，事多阻';
        
        text += `\n用神总体状态：${strengthText}`;
        
        return {
            text: text,
            strength: maxStrength >= 5 ? '强' : '弱',
            yaos: yongShenYaos,
            strongestYao: strongestYao
        };
    }
    
    /**
     * 计算爻的强度（简化的评分）
     */
    calculateYaoStrength(yao) {
        let score = 0;
        const wangShuaiScore = {
            '极旺': 10, '旺': 8, '相': 6, '平': 4, '休': 2, '囚': 1, '死': 0, '极衰': -2
        };
        score += wangShuaiScore[yao.wangShuai.overall] || 4;
        if (yao.isChanging) score += 3;
        if (yao.shiYing === '世' || yao.shiYing === '应') score += 2;
        
        const liuShenScore = {
            '青龙': 2, '朱雀': 0, '勾陈': -1, '螣蛇': -1, '白虎': -2, '玄武': -1
        };
        score += liuShenScore[yao.liuShen] || 0;
        
        return Math.max(0, Math.min(10, score));
    }
    
    /**
     * 分析动爻
     */
    analyzeChangingYaos(hexagram, paiguaResult) {
        const changingYaos = hexagram.changingYaos;
        const yaos = paiguaResult.yaoData;
        
        if (changingYaos.length === 0) {
            return {
                hasChanging: false,
                text: '本卦为静卦，无动爻。主事体平稳，变化不大。'
            };
        }
        
        let text = `卦中有${changingYaos.length}个动爻：\n`;
        
        changingYaos.forEach(position => {
            const yao = yaos.find(y => y.position === position);
            if (yao) {
                text += `\n第${position}爻（${yao.positionName}）${yao.dizhi} ${yao.liuQin} ${yao.isYang ? '阳' : '阴'}动：`;
                // 获取爻辞
                const yaoText = hexagramDatabase.getYaoText(paiguaResult.guaInfo.number, position);
                text += `"${yaoText}"\n`;
                text += `${yao.isYang ? '阳爻发动，主动进取、显露之象。' : '阴爻发动，主柔顺、隐忍之象。'}`;
                text += ` ${yao.liuShen}主事，${this.liuShenMeanings[yao.liuShen] || ''}\n`;
            }
        });
        
        const benGuaName = hexagram.benGua.name;
        const bianGuaName = hexagram.bianGua?.name || '未知';
        text += `\n本卦${benGuaName}变为${bianGuaName}，`;
        if (changingYaos.length === 1) text += '独发主事专一。';
        else if (changingYaos.length >= 4) text += '多爻发动，事体复杂多变。';
        else text += '事体有变，宜观其变。';
        
        return {
            hasChanging: true,
            text: text,
            positions: changingYaos
        };
    }
    
    /**
     * 分析世应关系
     */
    analyzeShiYing(paiguaResult) {
        const shiYao = paiguaResult.yaoData.find(y => y.shiYing === '世');
        const yingYao = paiguaResult.yaoData.find(y => y.shiYing === '应');
        
        if (!shiYao || !yingYao) {
            return { text: '世应不明，需谨慎行事。' };
        }
        
        let text = `世爻在${shiYao.position}爻（${shiYao.positionName}），应爻在${yingYao.position}爻（${yingYao.positionName}）。\n`;
        
        // 简化的五行生克判断
        const shiWuXing = shiYao.diZhiWuXing;
        const yingWuXing = yingYao.diZhiWuXing;
        
        if (shiWuXing === yingWuXing) {
            text += '世应五行相同，主合作顺利，意见相合。';
        } else if (this.isSheng(shiWuXing, yingWuXing)) {
            text += '世生应爻，主我求于人或我主动。';
        } else if (this.isKe(shiWuXing, yingWuXing)) {
            text += '世克应爻，主我能掌控局面。';
        } else if (this.isSheng(yingWuXing, shiWuXing)) {
            text += '应生世爻，主他人助我或事来找我。';
        } else if (this.isKe(yingWuXing, shiWuXing)) {
            text += '应克世爻，主受制于人或事多阻碍。';
        }
        
        return { text: text };
    }
    
    /**
     * 五行相生判断
     */
    isSheng(giver, receiver) {
        const shengMap = {
            '金': '水', '水': '木', '木': '火', '火': '土', '土': '金'
        };
        return shengMap[giver] === receiver;
    }
    
    /**
     * 五行相克判断
     */
    isKe(giver, receiver) {
        const keMap = {
            '金': '木', '木': '土', '土': '水', '水': '火', '火': '金'
        };
        return keMap[giver] === receiver;
    }
    
    /**
     * 分析五行分布
     */
    analyzeWuXing(paiguaResult) {
        const yaos = paiguaResult.yaoData;
        const wuXingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
        
        yaos.forEach(yao => {
            if (wuXingCount.hasOwnProperty(yao.diZhiWuXing)) {
                wuXingCount[yao.diZhiWuXing]++;
            }
        });
        
        let text = '卦中五行分布：';
        Object.entries(wuXingCount).forEach(([wx, count]) => {
            if (count > 0) text += `${wx}${count}个 `;
        });
        
        const dateInfo = paiguaResult.dateInfo;
        text += `\n月建${dateInfo.yueJian}属${dateInfo.yueWuXing}，日辰${dateInfo.riChen}属${dateInfo.riWuXing}。`;
        if (dateInfo.yueWuXing === dateInfo.riWuXing) {
            text += `月日同属${dateInfo.yueWuXing}，${dateInfo.yueWuXing}气极旺。`;
        }
        
        return text;
    }
    
    /**
     * 生成总体解读
     */
    generateOverallInterpretation(guaText, yongShenAnalysis, hasChanging, shiYingAnalysis) {
        let text = `卦象：${guaText.name}\n`;
        text += `卦辞："${guaText.text}"\n`;
        text += `解读：${guaText.explanation}\n\n`;
        
        if (!hasChanging) {
            text += '此卦为静卦，主事体平稳，进展较慢。';
        } else {
            text += '卦中有动爻，事体将有变化。';
        }
        
        text += `\n\n用神状态：${yongShenAnalysis.strength === '强' ? '有利' : '需注意'}`;
        
        return text;
    }
    
    /**
     * 生成建议
     */
    generateAdvice(yongShenAnalysis, changingYaoAnalysis, shiYingAnalysis) {
        let advice = '';
        
        if (yongShenAnalysis.strength === '强') {
            advice += '✅ 用神强旺，宜积极进取，主动把握机会。\n';
        } else {
            advice += '⚠️ 用神偏弱，宜保守谨慎，等待时机。\n';
        }
        
        if (changingYaoAnalysis.hasChanging) {
            if (changingYaoAnalysis.positions.length === 1) {
                advice += '🔮 独发之爻为重点，需特别关注其提示。\n';
            }
            if (changingYaoAnalysis.text.includes('白虎') || changingYaoAnalysis.text.includes('玄武')) {
                advice += '🚨 动爻见凶神，需防范风险，谨慎行事。\n';
            }
        }
        
        if (shiYingAnalysis.text.includes('应克世')) {
            advice += '⚠️ 应爻克世爻，注意外部压力或他人阻碍。\n';
        }
        
        advice += '\n💡 提示：卦象仅供参考，具体决策还需结合现实情况。';
        
        return advice;
    }
}

// 创建全局实例
const jieGuaEngine = new JieGuaEngine();

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = jieGuaEngine;
} else {
    window.jieGuaEngine = jieGuaEngine;
}