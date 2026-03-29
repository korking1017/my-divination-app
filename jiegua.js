// 六爻解卦引擎
class JieGuaEngine {
    constructor() {
        // 用神对应关系
        this.yongShenMap = {
            'wealth': '妻财',      // 财运
            'career': '官鬼',      // 事业
            'relationship': '妻财', // 感情（男测女为妻财，女测男为官鬼，简化处理）
            'health': '官鬼',      // 疾病
            'exam': '父母',        // 考试学业
            'others': '应爻'       // 其他
        };
        
        // 六神主事
        this.liuShenMeanings = {
            '青龙': '主喜庆、吉祥、财运、姻缘',
            '朱雀': '主口舌、文书、消息、官非',
            '勾陈': '主田土、房产、牢狱、慢性病',
            '螣蛇': '主虚惊、怪异、变化、小人',
            '白虎': '主凶丧、血光、伤病、官非',
            '玄武': '主盗贼、阴私、欺骗、暧昧'
        };
    }
    
    // 生成解卦结果
    generateInterpretation(hexagram, paiguaResult, questionType) {
        const guaNumber = paiguaResult.guaInfo.number;
        const changingYaos = hexagram.changingYaos;
        
        // 获取用神
        const yongShenType = this.yongShenMap[questionType] || '应爻';
        
        // 分析用神
        const yongShenAnalysis = this.analyzeYongShen(paiguaResult, yongShenType);
        
        // 分析动爻
        const changingYaoAnalysis = this.analyzeChangingYaos(hexagram, paiguaResult);
        
        // 分析世应关系
        const shiYingAnalysis = this.analyzeShiYing(paiguaResult);
        
        // 分析五行生克
        const wuXingAnalysis = this.analyzeWuXing(paiguaResult);
        
        // 获取卦辞
        const guaText = hexagramDatabase.getHexagramText(guaNumber);
        
        // 生成综合解读
        const overall = this.generateOverallInterpretation(
            guaText,
            yongShenAnalysis,
            changingYaos.length
        );
        
        return {
            questionType: questionType,
            yongShenType: yongShenType,
            overall: overall,
            yongShen: yongShenAnalysis.text,
            wuXing: wuXingAnalysis,
            shiYing: shiYingAnalysis,
            changingYaos: changingYaoAnalysis,
            guaText: guaText,
            advice: this.generateAdvice(yongShenAnalysis, changingYaoAnalysis)
        };
    }
    
    // 分析用神
    analyzeYongShen(paiguaResult, yongShenType) {
        const yaos = paiguaResult.yaoData;
        const yongShenYaos = yaos.filter(yao => yao.liuQin === yongShenType);
        
        let text = `所问之事以"${yongShenType}"为用神。\n`;
        
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
        
        // 判断用神强弱
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
    
    // 计算爻的强度
    calculateYaoStrength(yao) {
        let score = 0;
        
        // 旺衰评分
        const wangShuaiScore = {
            '极旺': 10, '旺': 8, '相': 6, '平': 4, '休': 2, '囚': 1, '死': 0, '极衰': -2
        };
        
        score += wangShuaiScore[yao.wangShuai.overall] || 4;
        
        // 动爻加分
        if (yao.isChanging) score += 3;
        
        // 世爻应爻加分
        if (yao.shiYing === '世' || yao.shiYing === '应') score += 2;
        
        // 六神吉凶影响
        const liuShenScore = {
            '青龙': 2, '朱雀': 0, '勾陈': -1, '螣蛇': -1, '白虎': -2, '玄武': -1
        };
        score += liuShenScore[yao.liuShen] || 0;
        
        return Math.max(0, Math.min(10, score));
    }
    
    // 分析动爻
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
                
                // 动爻影响
                if (yao.isYang) {
                    text += '阳爻发动，主动进取、显露之象。';
                } else {
                    text += '阴爻发动，主柔顺、隐忍之象。';
                }
                
                // 六神影响
                text += ` ${yao.liuShen}主事，${this.liuShenMeanings[yao.liuShen] || ''}\n`;
            }
        });
        
        // 变卦影响
        text += `\n本卦${hexagram.benGua.name}变为${hexagram.bianGua.name}，`;
        if (changingYaos.length === 1) {
            text += '独发主事专一。';
        } else if (changingYaos.length >= 4) {
            text += '多爻发动，事体复杂多变。';
        } else {
            text += '事体有变，宜观其变。';
        }
        
        return {
            hasChanging: true,
            text: text,
            positions: changingYaos
        };
    }
    
    // 分析世应关系
    analyzeShiYing(paiguaResult) {
        const shiYao = paiguaResult.yaoData.find(y => y.shiYing === '世');
        const yingYao = paiguaResult.yaoData.find(y => y.shiYing === '应');
        
        if (!shiYao || !yingYao) {
            return '世应不明，需谨慎行事。';
        }
        
        let text = `世爻在${shiYao.position}爻（${shiYao.positionName}），`;
        text += `应爻在${yingYao.position}爻（${yingYao.positionName}）。\n`;
        
        // 世应生克关系
        const shiWuXing = shiYao.dizhiWuXing;
        const yingWuXing = yingYao.dizhiWuXing;
        
        // 简化的五行生克判断
        const shengKeMap = {
            '金': { sheng: '水', ke: '木' },
            '木': { sheng: '火', ke: '土' },
            '水': { sheng: '木', ke: '火' },
            '火': { sheng: '土', ke: '金' },
            '土': { sheng: '金', ke: '水' }
        };
        
        if (shiWuXing === yingWuXing) {
            text += '世应五行相同，主合作顺利，意见相合。';
        } else if (shengKeMap[shiWuXing]?.sheng === yingWuXing) {
            text += '世生应爻，主我求于人或我主动。';
        } else if (shengKeMap[shiWuXing]?.ke === yingWuXing) {
            text += '世克应爻，主我能掌控局面。';
        } else if (shengKeMap[yingWuXing]?.sheng === shiWuXing) {
            text += '应生世爻，主他人助我或事来找我。';
        } else if (shengKeMap[yingWuXing]?.ke === shiWuXing) {
            text += '应克世爻，主受制于人或事多阻碍。';
        }
        
        return text;
    }
    
    // 分析五行生克
    analyzeWuXing(paiguaResult) {
        const yaos = paiguaResult.yaoData;
        const wuXingCount = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
        
        yaos.forEach(yao => {
            if (wuXingCount.hasOwnProperty(yao.dizhiWuXing)) {
                wuXingCount[yao.dizhiWuXing]++;
            }
        });
        
        let text = '卦中五行分布：';
        Object.entries(wuXingCount).forEach(([wx, count]) => {
            if (count > 0) {
                text += `${wx}${count}个 `;
            }
        });
        
        // 判断五行旺衰
        const yueWuXing = paiguaResult.dateInfo.yueWuXing;
        const riWuXing = paiguaResult.dateInfo.riWuXing;
        
        text += `\n月建${paiguaResult.dateInfo.yueJian}属${yueWuXing}，日辰${paiguaResult.dateInfo.riChen}属${riWuXing}。`;
        
        if (yueWuXing === riWuXing) {
            text += `月日同属${yueWuXing}，${yueWuXing}气极旺。`;
        }
        
        return text;
    }
    
    // 生成总体解读
    generateOverallInterpretation(guaText, yongShenAnalysis, changingCount) {
        let text = `卦象：${guaText.name}\n`;
        text += `卦辞："${guaText.text}"\n`;
        text += `解读：${guaText.explanation}\n\n`;
        
        if (changingCount === 0) {
            text += '此卦为静卦，主事体平稳，进展较慢。';
        } else if (changingCount <= 2) {
            text += '动爻不多，事体变化不大，可按计划行事。';
        } else if (changingCount <= 4) {
            text += '多爻发动，事体复杂多变，需灵活应对。';
        } else {
            text += '动爻众多，事体变化剧烈，宜谨慎决策。';
        }
        
        text += `\n\n用神状态：${yongShenAnalysis.strength === '强' ? '有利' : '需注意'}`;
        
        return text;
    }
    
    // 生成建议
    generateAdvice(yongShenAnalysis, changingYaoAnalysis) {
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
            
            // 检查是否有特殊的六神组合
            const hasXiongShen = ['白虎', '玄武'].some(shen => 
                changingYaoAnalysis.text.includes(shen)
            );
            
            if (hasXiongShen) {
                advice += '🚨 动爻见凶神，需防范风险，谨慎行事。\n';
            }
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