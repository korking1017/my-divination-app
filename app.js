// 六爻算卦应用 - 重构完整版（显示顺序修正）
// 核心原则：
// 1. 二进制编码统一为：索引0=初爻，索引5=上爻（内部存储）
// 2. 卦象图形显示：上爻在上，初爻在下（逆序绘制）
// 3. 排卦表格显示：从上到下显示上爻→初爻，表格标签也对应调整
// 4. 所有数据流保持一致性

class LiuYaoApp {
    constructor() {
        console.log('=== 六爻算卦应用初始化 ===');
        
        // 应用状态
        this.currentStep = 0;           // 当前抛掷到第几爻（0-5）
        this.yaoValues = [];             // 存储6爻的值：[初爻, 二爻, 三爻, 四爻, 五爻, 上爻]
        this.coinResults = [];           // 每爻的铜钱结果
        this.currentHexagram = null;     // 当前卦象
        this.paiguaResult = null;        // 排卦结果
        this.jieguaResult = null;        // 解卦结果
        
        // 初始化UI
        this.initElements();
        this.initEventListeners();
        this.updateDateTime();
        
        // 加载历史记录
        setTimeout(() => this.loadHistory(), 500);
        
        console.log('应用初始化完成');
    }
    
    // ==================== 初始化DOM元素 ====================
    initElements() {
        console.log('初始化DOM元素...');
        
        // 铜钱抛掷区域
        this.coinElements = [
            document.getElementById('coin1'),
            document.getElementById('coin2'),
            document.getElementById('coin3')
        ];
        this.coinResultEl = document.getElementById('coinResult');
        this.progressFill = document.getElementById('progressFill');
        this.currentYaoEl = document.getElementById('currentYao');
        this.tossBtn = document.getElementById('tossBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.backBtn = document.getElementById('backBtn');
        
        // 卦象显示区域
        this.hexagramSection = document.getElementById('hexagramSection');
        this.benGuaNameEl = document.getElementById('benGuaName');
        this.benGuaDisplayEl = document.getElementById('benGuaDisplay');
        this.bianGuaBox = document.getElementById('bianGuaBox');
        this.bianGuaNameEl = document.getElementById('bianGuaName');
        this.bianGuaDisplayEl = document.getElementById('bianGuaDisplay');
        this.changingYaosEl = document.getElementById('changingYaos');
        this.shangGuaEl = document.getElementById('shangGua');
        this.xiaGuaEl = document.getElementById('xiaGua');
        
        // 排卦区域
        this.paiguaSection = document.getElementById('paiguaSection');
        this.paiguaBody = document.getElementById('paiguaBody');
        
        // 解卦区域
        this.interpretationSection = document.getElementById('interpretationSection');
        this.interpretationContent = document.getElementById('interpretationContent');
        this.questionSelect = document.getElementById('questionSelect');
        this.genderRadios = document.querySelectorAll('input[name="gender"]');
        
        // 历史记录区域
        this.historySection = document.getElementById('historySection');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        // 导航按钮
        this.navBtns = document.querySelectorAll('.nav-btn');
        
        // 日期时间显示
        this.dateDisplay = document.getElementById('dateDisplay');
        
        console.log('DOM元素初始化完成');
    }
    
    // ==================== 初始化事件监听器 ====================
    initEventListeners() {
        console.log('初始化事件监听器...');
        
        // 抛掷按钮
        if (this.tossBtn) {
            this.tossBtn.addEventListener('click', () => this.tossCoins());
        }
        
        // 重置按钮
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.resetApp());
        }
        
        // 返回按钮
        if (this.backBtn) {
            this.backBtn.addEventListener('click', () => this.showSection('coin'));
        }
        
        // 导航按钮
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                if (section) this.showSection(section);
            });
        });
        
        // 问事类型选择
        if (this.questionSelect) {
            this.questionSelect.addEventListener('change', () => this.generateInterpretation());
        }
        
        // 性别选择
        this.genderRadios.forEach(radio => {
            radio.addEventListener('change', () => this.generateInterpretation());
        });
        
        // 清空历史记录
        if (this.clearHistoryBtn) {
            this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        }
        
        console.log('事件监听器初始化完成');
    }
    
    // ==================== 更新日期时间显示 ====================
    updateDateTime() {
        if (!this.dateDisplay) return;
        
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const timeStr = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        
        this.dateDisplay.textContent = `${dateStr} ${timeStr}`;
        
        // 每分钟更新一次
        setTimeout(() => this.updateDateTime(), 60000);
    }
    
    // ==================== 抛掷铜钱 ====================
    tossCoins() {
        console.log(`抛掷第${this.currentStep + 1}爻...`);
        
        if (this.currentStep >= 6) {
            console.warn('已抛掷6次');
            return;
        }
        
        // 禁用抛掷按钮
        if (this.tossBtn) {
            this.tossBtn.disabled = true;
        }
        
        // 初始化当前爻的铜钱结果
        if (!this.coinResults[this.currentStep]) {
            this.coinResults[this.currentStep] = [];
        }
        
        // 抛掷动画和结果生成
        let completedCount = 0;
        
        this.coinElements.forEach((coin, index) => {
            if (!coin) return;
            
            // 清空并添加动画
            coin.textContent = '';
            coin.classList.add('tossing');
            
            setTimeout(() => {
                // 随机生成铜钱结果（传统六爻：1=阳面/正面，0=阴面/背面）
                const result = Math.random() < 0.5 ? 1 : 0;
                coin.textContent = result === 1 ? '●' : '〇';
                coin.classList.remove('tossing');
                
                // 存储结果
                this.coinResults[this.currentStep][index] = result;
                
                console.log(`铜钱${index + 1}: ${result === 1 ? '阳●' : '阴〇'}`);
                
                completedCount++;
                
                // 三枚铜钱都抛掷完成，计算爻值
                if (completedCount === 3) {
                    setTimeout(() => this.calculateYao(), 200);
                }
            }, index * 200);
        });
    }
    
    // ==================== 计算爻值 ====================
    calculateYao() {
        const currentToss = this.coinResults[this.currentStep];
        if (!currentToss || currentToss.length !== 3) {
            console.error('铜钱结果异常');
            this.enableTossButton();
            return;
        }
        
        // 计算阳面数量
        const yangCount = currentToss.reduce((a, b) => a + b, 0);
        let yaoValue, yaoText, yaoSymbol;
        
        // 根据三枚铜钱的阳面数量确定爻值
        // 传统规则：3阳=老阳(动)，2阳=少阴，1阳=少阳，0阳=老阴(动)
        switch(yangCount) {
            case 3:
                yaoValue = 9;   // 老阳（动爻）
                yaoText = '老阳 ●●●';
                yaoSymbol = '⚊';  // 阳爻符号
                break;
            case 2:
                yaoValue = 8;   // 少阴
                yaoText = '少阴 ●●〇';
                yaoSymbol = '⚋';  // 阴爻符号
                break;
            case 1:
                yaoValue = 7;   // 少阳
                yaoText = '少阳 ●〇〇';
                yaoSymbol = '⚊';
                break;
            default: // 0
                yaoValue = 6;   // 老阴（动爻）
                yaoText = '老阴 〇〇〇';
                yaoSymbol = '⚋';
                break;
        }
        
        // 存储爻值（索引0=初爻）
        this.yaoValues[this.currentStep] = yaoValue;
        
        // 显示结果
        if (this.coinResultEl) {
            this.coinResultEl.textContent = `第${this.currentStep + 1}爻：${yaoText} ${this.currentStep === 5 ? '（完成）' : ''}`;
        }
        
        console.log(`第${this.currentStep + 1}爻结果: ${yaoText}, 数值: ${yaoValue}`);
        
        // 更新进度
        this.currentStep++;
        this.updateProgress();
        
        // 如果抛掷完成，生成卦象
        if (this.currentStep === 6) {
            console.log('六爻抛掷完成，开始生成卦象...');
            console.log('爻值数组（初爻到上爻）:', this.yaoValues);
            this.generateHexagram();
        } else {
            // 启用抛掷按钮，继续下一爻
            this.enableTossButton();
        }
    }
    
    // 启用抛掷按钮
    enableTossButton() {
        if (this.tossBtn && this.currentStep < 6) {
            setTimeout(() => {
                this.tossBtn.disabled = false;
            }, 500);
        }
    }
    
    // ==================== 更新进度条 ====================
    updateProgress() {
        const progress = (this.currentStep / 6) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        
        if (this.currentYaoEl) {
            this.currentYaoEl.textContent = this.currentStep;
        }
        
        if (this.currentStep === 6) {
            if (this.tossBtn) {
                this.tossBtn.disabled = true;
                this.tossBtn.textContent = '✅ 完成抛掷';
            }
            if (this.resetBtn) {
                this.resetBtn.disabled = false;
            }
        }
    }
    
    // ==================== 生成卦象（核心函数） ====================
    generateHexagram() {
        console.log('=== 生成卦象开始 ===');
        console.log('爻值数组（初->上）:', this.yaoValues);
        
        if (this.yaoValues.length !== 6) {
            console.error('爻值数量异常:', this.yaoValues.length);
            alert('爻值数据异常，请重新抛掷');
            return;
        }
        
        try {
            // 1. 生成本卦二进制（从初爻到上爻）
            const benGuaBinary = this.generateBenGuaBinary();
            console.log('本卦二进制（初->上）:', benGuaBinary.join(''));
            
            // 2. 生成变卦二进制（从初爻到上爻）
            const bianGuaBinary = this.generateBianGuaBinary();
            console.log('变卦二进制（初->上）:', bianGuaBinary.join(''));
            
            // 3. 计算动爻位置（1-6，从初爻开始）
            const changingYaos = this.calculateChangingYaos();
            console.log('动爻位置:', changingYaos);
            
            // 4. 提取上下卦（下卦=索引0-2，上卦=索引3-5）
            const xiaBinary = benGuaBinary.slice(0, 3).join('');
            const shangBinary = benGuaBinary.slice(3, 6).join('');
            console.log('下卦二进制:', xiaBinary, '上卦二进制:', shangBinary);
            
            // 5. 查找本卦数据
            const benGuaData = this.findHexagramData(benGuaBinary.join(''));
            if (!benGuaData) {
                throw new Error('本卦查找失败');
            }
            console.log('本卦:', benGuaData.name);
            
            // 6. 查找变卦数据
            const bianGuaData = this.findHexagramData(bianGuaBinary.join(''));
            console.log('变卦:', bianGuaData?.name || '无');
            
            // 7. 获取上下卦名
            const xiaName = this.getGuaName(xiaBinary);
            const shangName = this.getGuaName(shangBinary);
            console.log('下卦:', xiaName, '上卦:', shangName);
            
            // 8. 获取卦辞
            const guaTextData = this.getHexagramText(benGuaData.number);
            
            // 9. 保存卦象数据
            this.currentHexagram = {
                benGua: {
                    binary: benGuaBinary,
                    binaryStr: benGuaBinary.join(''),
                    shangGua: shangName,
                    xiaGua: xiaName,
                    name: benGuaData.name,
                    number: benGuaData.number || 0,
                    guaGong: benGuaData.guaGong || shangName,
                    shiWei: benGuaData.shiWei || this.getDefaultShiWei(benGuaBinary),
                    yingWei: benGuaData.yingWei || this.getDefaultYingWei(benGuaBinary),
                    wuXing: benGuaData.wuXing || this.getGuaWuXing(shangName),
                    guaText: guaTextData?.text || '',
                    explanation: guaTextData?.explanation || '',
                    judgment: guaTextData?.judgment || ''
                },
                bianGua: bianGuaData ? {
                    binary: bianGuaBinary,
                    binaryStr: bianGuaBinary.join(''),
                    name: bianGuaData.name,
                    number: bianGuaData.number || 0
                } : null,
                changingYaos: changingYaos,
                yaoValues: [...this.yaoValues],
                timestamp: new Date().toISOString()
            };
            
            console.log('卦象生成完成:', this.currentHexagram.benGua.name);
            
            // 10. 显示卦象
            this.displayHexagram();
            
            // 11. 切换到卦象页面
            this.showSection('hexagram');
            
            // 12. 延迟生成排卦
            setTimeout(() => {
                this.generatePaigua();
            }, 100);
            
        } catch (error) {
            console.error('生成卦象失败:', error);
            alert('生成卦象失败：' + error.message);
            this.resetApp();
        }
    }
    
    // 生成本卦二进制（初爻到上爻）
    generateBenGuaBinary() {
        return this.yaoValues.map(v => {
            if (v === 9 || v === 7) return 1; // 老阳、少阳 = 阳爻
            if (v === 6 || v === 8) return 0; // 老阴、少阴 = 阴爻
            return 0;
        });
    }
    
    // 生成变卦二进制（老阳变阴，老阴变阳）
    generateBianGuaBinary() {
        return this.yaoValues.map(v => {
            if (v === 9) return 0;   // 老阳变阴
            if (v === 6) return 1;   // 老阴变阳
            if (v === 7) return 1;   // 少阳不变
            if (v === 8) return 0;   // 少阴不变
            return v === 1 ? 1 : 0;
        });
    }
    
    // 计算动爻位置（1-6，1=初爻）
    calculateChangingYaos() {
        return this.yaoValues
            .map((v, i) => (v === 6 || v === 9) ? i + 1 : null)
            .filter(i => i !== null);
    }
    
    // 获取默认世爻位置（基于卦象二进制）
    getDefaultShiWei(binary) {
        // 简化：根据上下卦组合返回默认世爻位置
        // 实际应根据八卦宫位确定，这里提供默认值
        return 1;
    }
    
    // 获取默认应爻位置
    getDefaultYingWei(binary) {
        return 4;
    }
    
    // 获取卦的五行属性
    getGuaWuXing(guaName) {
        const wuXingMap = {
            '乾': '金', '兑': '金',
            '震': '木', '巽': '木',
            '坎': '水',
            '离': '火',
            '坤': '土', '艮': '土'
        };
        return wuXingMap[guaName] || '金';
    }
    
    // 查找卦象数据
    findHexagramData(binary6) {
        if (!hexagramDatabase) {
            console.error('hexagramDatabase未加载');
            return null;
        }
        
        // 尝试直接查找
        let result = hexagramDatabase.findHexagramByBinary(binary6);
        
        // 如果返回的是回退卦象且有number为0，尝试通过上下卦组合查找
        if (result && result.number === 0 && result.isFallback) {
            const xiaBinary = binary6.slice(0, 3);
            const shangBinary = binary6.slice(3, 6);
            const xiaName = this.getGuaName(xiaBinary);
            const shangName = this.getGuaName(shangBinary);
            
            // 尝试通过卦名查找
            const fullName = `${shangName}${xiaName}`;
            for (const [binary, data] of Object.entries(hexagramDatabase.guaGongData || {})) {
                if (data.name === fullName || data.name === `${shangName}为${xiaName}`) {
                    return data;
                }
            }
        }
        
        return result;
    }
    
    // 获取卦名（3位二进制）
    getGuaName(binary3) {
        if (!hexagramDatabase || !hexagramDatabase.bagua) {
            return '未知';
        }
        return hexagramDatabase.bagua[binary3]?.name || '未知';
    }
    
    // 获取卦辞
    getHexagramText(number) {
        if (!hexagramDatabase || !hexagramDatabase.hexagramTexts) {
            return { text: '', explanation: '' };
        }
        return hexagramDatabase.hexagramTexts[number] || { text: '', explanation: '' };
    }
    
    // ==================== 显示卦象（逆序绘制：上爻在上，初爻在下） ====================
    displayHexagram() {
        console.log('显示卦象...');
        
        if (!this.currentHexagram || !this.currentHexagram.benGua) {
            console.error('没有卦象数据');
            return;
        }
        
        const { benGua, bianGua, changingYaos = [] } = this.currentHexagram;
        
        // 显示卦名
        if (this.benGuaNameEl) {
            this.benGuaNameEl.textContent = benGua.name || '未知卦';
        }
        
        // 显示上下卦
        if (this.shangGuaEl && this.xiaGuaEl) {
            this.shangGuaEl.textContent = benGua.shangGua || '未知';
            this.xiaGuaEl.textContent = benGua.xiaGua || '未知';
        }
        
        // 绘制本卦（上爻在上，初爻在下）
        if (this.benGuaDisplayEl) {
            this.benGuaDisplayEl.innerHTML = '';
            // 逆序添加：i从5到0，对应上爻到初爻
            for (let i = 5; i >= 0; i--) {
                const yaoDiv = document.createElement('div');
                yaoDiv.className = 'yao-line';
                
                // 判断阴阳
                if (benGua.binary[i] === 1) {
                    yaoDiv.classList.add('yao-yang');
                } else {
                    yaoDiv.classList.add('yao-yin');
                }
                
                // 判断动爻（位置从1开始）
                if (changingYaos.includes(i + 1)) {
                    yaoDiv.classList.add('yao-changing');
                    yaoDiv.setAttribute('data-changing', 'true');
                }
                
                // 添加爻位标识
                yaoDiv.setAttribute('data-yao-position', i + 1);
                
                this.benGuaDisplayEl.appendChild(yaoDiv);
            }
        }
        
        // 处理变卦
        if (bianGua && changingYaos.length > 0) {
            if (this.bianGuaBox) {
                this.bianGuaBox.style.display = 'block';
            }
            
            if (this.bianGuaNameEl) {
                this.bianGuaNameEl.textContent = bianGua.name || '未知卦';
            }
            
            // 绘制变卦（同样逆序）
            if (this.bianGuaDisplayEl) {
                this.bianGuaDisplayEl.innerHTML = '';
                for (let i = 5; i >= 0; i--) {
                    const yaoDiv = document.createElement('div');
                    yaoDiv.className = 'yao-line';
                    
                    if (bianGua.binary[i] === 1) {
                        yaoDiv.classList.add('yao-yang');
                    } else {
                        yaoDiv.classList.add('yao-yin');
                    }
                    
                    this.bianGuaDisplayEl.appendChild(yaoDiv);
                }
            }
        } else {
            if (this.bianGuaBox) {
                this.bianGuaBox.style.display = 'none';
            }
        }
        
        // 显示动爻信息
        if (this.changingYaosEl) {
            if (changingYaos.length > 0) {
                const yaoNames = changingYaos.map(pos => {
                    const names = ['初', '二', '三', '四', '五', '上'];
                    return `${names[pos - 1]}爻`;
                });
                this.changingYaosEl.textContent = `⚡ 动爻：${yaoNames.join('、')}`;
            } else {
                this.changingYaosEl.textContent = '📌 无动爻（静卦）';
            }
        }
        
        console.log('卦象显示完成');
    }
    
    // ==================== 生成排卦 ====================
    generatePaigua() {
        console.log('开始排卦...');
        
        if (!this.currentHexagram) {
            console.error('没有卦象数据，无法排卦');
            return;
        }
        
        try {
            if (typeof paiguaEngine !== 'undefined' && paiguaEngine) {
                this.paiguaResult = paiguaEngine.generatePaigua(this.currentHexagram);
                console.log('排卦结果:', this.paiguaResult);
                
                if (this.paiguaResult && this.paiguaResult.yaoData) {
                    this.displayPaigua();
                } else {
                    this.displaySimplePaigua();
                }
            } else {
                console.warn('排卦引擎未加载');
                this.displaySimplePaigua();
            }
            
            // 保存到历史记录
            this.saveToHistory();
            
        } catch (error) {
            console.error('排卦失败:', error);
            this.displaySimplePaigua();
        }
    }
    
    // 显示完整排卦表格（逆序：上爻→初爻）
    displayPaigua() {
        if (!this.paiguaBody || !this.paiguaResult || !this.paiguaResult.yaoData) {
            console.error('排卦数据不完整');
            this.displaySimplePaigua();
            return;
        }
        
        this.paiguaBody.innerHTML = '';
        
        // 爻位标签逆序：上爻、五爻、四爻、三爻、二爻、初爻
        const positionNames = ['上爻', '五爻', '四爻', '三爻', '二爻', '初爻'];
        
        // 逆序循环 i 从 5 到 0
        for (let i = 5; i >= 0; i--) {
            const yaoData = this.paiguaResult.yaoData[i];
            if (!yaoData) continue;
            
            const row = document.createElement('tr');
            
            // 获取爻象文本
            const yaoSymbol = this.getYaoSymbolText(yaoData.isYang, yaoData.isChanging);
            
            // 表格行按逆序添加，但第一行是上爻
            row.innerHTML = `
                <td style="font-weight: bold;">${positionNames[5 - i]}</td>
                <td>${yaoSymbol}</td>
                <td>${yaoData.dizhi || '--'}</td>
                <td>${yaoData.liuQin || '--'}</td>
                <td>${yaoData.shiYing || '--'}</td>
                <td>${yaoData.liuShen || '--'}</td>
                <td>${yaoData.isChanging ? '⚡动' : ''}</td>
            `;
            
            this.paiguaBody.appendChild(row);
        }
    }
    
    // 显示简化排卦
    displaySimplePaigua() {
        if (!this.paiguaBody) return;
        
        const hexagram = this.currentHexagram?.benGua;
        const changingYaos = this.currentHexagram?.changingYaos || [];
        
        this.paiguaBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 30px;">
                    <div style="color: var(--primary); margin-bottom: 10px;">
                        📊 ${hexagram?.name || '未知卦'}
                    </div>
                    <div style="font-size: 0.9rem; color: #666;">
                        二进制：${hexagram?.binaryStr || '------'}<br>
                        动爻：${changingYaos.length > 0 ? changingYaos.join('、') : '无'}<br>
                        ${changingYaos.length > 0 ? `变卦：${this.currentHexagram?.bianGua?.name || '未知'}` : ''}
                    </div>
                </td>
            </tr>
        `;
    }
    
    // 获取爻象文本
    getYaoSymbolText(isYang, isChanging) {
        if (isChanging) {
            return isYang ? '⚊老阳' : '⚋老阴';
        }
        return isYang ? '⚊少阳' : '⚋少阴';
    }
    
    // ==================== 生成解卦 ====================
    generateInterpretation() {
        console.log('生成解卦...');
        
        if (!this.currentHexagram) {
            console.error('没有卦象数据');
            if (this.interpretationContent) {
                this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成抛掷起卦</p>';
            }
            return;
        }
        
        const questionType = this.questionSelect?.value;
        if (!questionType) {
            this.showInterpretationMessage('请先选择问事类型');
            return;
        }
        
        const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
        
        try {
            if (typeof jieGuaEngine !== 'undefined' && jieGuaEngine) {
                this.jieguaResult = jieGuaEngine.generateInterpretation(
                    this.currentHexagram,
                    this.paiguaResult,
                    questionType,
                    gender
                );
                this.displayInterpretation();
            } else {
                this.showBasicInterpretation();
            }
        } catch (error) {
            console.error('解卦失败:', error);
            this.showBasicInterpretation();
        }
    }
    
    // ==================== 显示解卦结果（重写，解决用神、动爻、重复等问题） ====================
    displayInterpretation() {
        if (!this.interpretationContent) return;
        
        if (!this.jieguaResult) {
            this.showBasicInterpretation();
            return;
        }
        
        const hexagram = this.currentHexagram.benGua;
        const jr = this.jieguaResult;
        const changingYaos = this.currentHexagram.changingYaos;
        
        let html = '<div class="interpretation-container">';
        
        // 1. 卦象基本信息（保留）
        html += `
            <div class="interpretation-item">
                <h4>📊 ${hexagram.name}</h4>
                <p><strong>卦辞：</strong>${hexagram.guaText || '暂无'}</p>
                <p><strong>解读：</strong>${hexagram.explanation || '暂无'}</p>
                <p><strong>上下卦：</strong>${hexagram.shangGua}上 ${hexagram.xiaGua}下</p>
                <p><strong>二进制：</strong>${hexagram.binaryStr}</p>
            </div>
        `;
        
        // 2. 用神分析（使用 jieguaResult 中的 yongShen 文本，并补充数据库中的用神建议）
        if (jr.yongShen) {
            html += `
                <div class="interpretation-item">
                    <h4>🔍 用神分析</h4>
                    <p>${jr.yongShen.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        // 获取并显示更详细的用神建议（从数据库）
        try {
            const yongShenAdvice = hexagramDatabase.getYongShenAdvice(
                jr.questionType || this.questionSelect?.value,
                document.querySelector('input[name="gender"]:checked')?.value || 'male'
            );
            if (yongShenAdvice && yongShenAdvice.tips) {
                html += `
                    <div class="interpretation-item">
                        <h4>💡 用神建议</h4>
                        <p>${yongShenAdvice.tips}</p>
                    </div>
                `;
            }
        } catch (e) {
            console.warn('获取用神建议失败', e);
        }
        
        // 3. 动爻分析（使用 jieguaResult 中已经生成的详细文本，包含爻辞和六神）
        if (changingYaos.length > 0) {
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻分析</h4>
                    <p>${jr.changingYaos ? jr.changingYaos.replace(/\n/g, '<br>') : '无详细分析'}</p>
                </div>
            `;
        } else {
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻分析</h4>
                    <p>本卦无动爻（静卦），事体平稳，变化不大。</p>
                </div>
            `;
        }
        
        // 4. 世应关系（如果存在）
        if (jr.shiYing) {
            html += `
                <div class="interpretation-item">
                    <h4>⚖️ 世应关系</h4>
                    <p>${jr.shiYing.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        // 5. 综合建议（保留）
        if (jr.advice) {
            html += `
                <div class="interpretation-item">
                    <h4>💡 综合建议</h4>
                    <p>${jr.advice.replace(/\n/g, '<br>')}</p>
                </div>
            `;
        }
        
        html += '</div>';
        this.interpretationContent.innerHTML = html;
    }
    
    // 显示基础解卦（增强版，也尽量显示用神和动爻详细）
    showBasicInterpretation() {
        if (!this.interpretationContent) return;
        
        const hexagram = this.currentHexagram?.benGua;
        const changingYaos = this.currentHexagram?.changingYaos || [];
        
        if (!hexagram) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成抛掷起卦</p>';
            return;
        }
        
        let html = `
            <div class="interpretation-container">
                <div class="interpretation-item">
                    <h4>📊 ${hexagram.name}</h4>
                    <p><strong>卦辞：</strong>${hexagram.guaText || '暂无'}</p>
                    <p><strong>解读：</strong>${hexagram.explanation || '暂无'}</p>
                </div>
        `;
        
        // 尝试获取用神建议（即使没有完整排卦，也可以基于问事类型给提示）
        const questionType = this.questionSelect?.value;
        if (questionType) {
            const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
            try {
                const yongShenAdvice = hexagramDatabase.getYongShenAdvice(questionType, gender);
                if (yongShenAdvice) {
                    html += `
                        <div class="interpretation-item">
                            <h4>🔍 用神提示</h4>
                            <p>${yongShenAdvice.description || ''}<br>${yongShenAdvice.tips || ''}</p>
                        </div>
                    `;
                }
            } catch(e) {}
        }
        
        if (changingYaos.length > 0) {
            const yaoNames = changingYaos.map(pos => {
                const names = ['初', '二', '三', '四', '五', '上'];
                return `${names[pos-1]}爻`;
            }).join('、');
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻信息</h4>
                    <p>本卦有${changingYaos.length}个动爻：${yaoNames}<br>变卦：${this.currentHexagram?.bianGua?.name || '未知'}</p>
                </div>
            `;
        } else {
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻信息</h4>
                    <p>本卦无动爻（静卦），事体平稳。</p>
                </div>
            `;
        }
        
        html += `
            <div class="interpretation-item">
                <h4>💡 解卦提示</h4>
                <p>• 请结合排卦表格中的地支、六亲、世应、六神综合分析<br>
                • 选择问事类型可获得更详细的解读</p>
            </div>
        `;
        
        html += '</div>';
        this.interpretationContent.innerHTML = html;
    }
    
    // 显示解卦消息
    showInterpretationMessage(message) {
        if (!this.interpretationContent) return;
        this.interpretationContent.innerHTML = `<p style="text-align:center;color:#666;padding:40px;">${message}</p>`;
    }
    
    // ==================== 历史记录管理 ====================
    saveToHistory() {
        if (!this.currentHexagram) return;
        
        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            hexagram: this.currentHexagram,
            questionType: this.questionSelect?.value || '未指定',
            paigua: this.paiguaResult
        };
        
        try {
            const history = JSON.parse(localStorage.getItem('liuyao_history') || '[]');
            history.unshift(record);
            
            // 只保留最近50条
            if (history.length > 50) history.length = 50;
            
            localStorage.setItem('liuyao_history', JSON.stringify(history));
            this.loadHistory();
        } catch (error) {
            console.error('保存历史记录失败:', error);
        }
    }
    
    loadHistory() {
        if (!this.historyList) return;
        
        try {
            const history = JSON.parse(localStorage.getItem('liuyao_history') || '[]');
            this.displayHistory(history);
        } catch (error) {
            console.error('加载历史记录失败:', error);
            this.displayHistory([]);
        }
    }
    
    displayHistory(records) {
        if (!this.historyList) return;
        
        if (!records || records.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">📭 暂无历史记录</div>';
            return;
        }
        
        this.historyList.innerHTML = records.map(record => `
            <div class="history-item" data-id="${record.id}">
                <div class="history-item-date">
                    ${new Date(record.timestamp).toLocaleString('zh-CN', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                <div class="history-item-gua">
                    ${record.hexagram?.benGua?.name || '未知卦'}
                    ${record.hexagram?.changingYaos?.length > 0 ? '⚡' : ''}
                </div>
                <div class="history-item-question">
                    ${this.getQuestionTypeText(record.questionType)}
                </div>
            </div>
        `).join('');
        
        // 绑定点击事件
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = parseInt(item.dataset.id);
                this.viewHistory(id);
            });
        });
    }
    
    getQuestionTypeText(type) {
        const map = {
            'wealth': '💰 财运',
            'career': '💼 事业',
            'relationship': '💕 感情',
            'health': '🏥 健康',
            'exam': '📚 考试',
            'others': '❓ 其他'
        };
        return map[type] || '未指定';
    }
    
    viewHistory(recordId) {
        try {
            const history = JSON.parse(localStorage.getItem('liuyao_history') || '[]');
            const record = history.find(r => r.id === recordId);
            
            if (!record) {
                alert('找不到该历史记录');
                return;
            }
            
            // 恢复卦象
            this.currentHexagram = record.hexagram;
            this.paiguaResult = record.paigua;
            this.yaoValues = record.hexagram.yaoValues;
            
            // 显示卦象
            this.displayHexagram();
            
            // 设置问事类型
            if (this.questionSelect && record.questionType) {
                this.questionSelect.value = record.questionType;
            }
            
            // 显示排卦
            if (this.paiguaResult && this.paiguaResult.yaoData) {
                this.displayPaigua();
            }
            
            // 生成解卦
            this.generateInterpretation();
            
            // 切换到卦象页面
            this.showSection('hexagram');
            
        } catch (error) {
            console.error('查看历史记录失败:', error);
            alert('查看历史记录失败');
        }
    }
    
    clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) return;
        
        try {
            localStorage.removeItem('liuyao_history');
            this.loadHistory();
            alert('历史记录已清空');
        } catch (error) {
            console.error('清空历史记录失败:', error);
            alert('清空历史记录失败');
        }
    }
    
    // ==================== 页面导航 ====================
    showSection(sectionName) {
        console.log(`切换到页面: ${sectionName}`);
        
        // 隐藏所有区域
        const sections = ['coin', 'hexagram', 'paigua', 'interpretation', 'history'];
        sections.forEach(section => {
            const el = document.getElementById(`${section}Section`);
            if (el) el.style.display = 'none';
        });
        
        // 显示目标区域
        const targetEl = document.getElementById(`${sectionName}Section`);
        if (targetEl) targetEl.style.display = 'block';
        
        // 更新导航按钮状态
        this.navBtns.forEach(btn => {
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 特殊处理：解卦页面需要生成解卦
        if (sectionName === 'interpretation' && this.currentHexagram) {
            setTimeout(() => this.generateInterpretation(), 100);
        }
    }
    
    // ==================== 重置应用 ====================
    resetApp() {
        if (!confirm('确定要重新开始吗？当前进度将丢失。')) return;
        
        this.currentStep = 0;
        this.yaoValues = [];
        this.coinResults = [];
        this.currentHexagram = null;
        this.paiguaResult = null;
        this.jieguaResult = null;
        
        // 重置UI
        if (this.coinResultEl) this.coinResultEl.textContent = '等待抛掷...';
        
        this.coinElements.forEach(coin => {
            if (coin) {
                coin.textContent = '';
                coin.classList.remove('tossing');
            }
        });
        
        if (this.tossBtn) {
            this.tossBtn.disabled = false;
            this.tossBtn.textContent = '🪙 抛掷铜钱';
        }
        
        if (this.resetBtn) this.resetBtn.disabled = true;
        
        this.updateProgress();
        
        // 清空卦象显示
        if (this.benGuaDisplayEl) this.benGuaDisplayEl.innerHTML = '';
        if (this.bianGuaDisplayEl) this.bianGuaDisplayEl.innerHTML = '';
        if (this.benGuaNameEl) this.benGuaNameEl.textContent = '';
        if (this.bianGuaNameEl) this.bianGuaNameEl.textContent = '';
        if (this.changingYaosEl) this.changingYaosEl.textContent = '';
        if (this.shangGuaEl) this.shangGuaEl.textContent = '';
        if (this.xiaGuaEl) this.xiaGuaEl.textContent = '';
        
        // 清空排卦表格
        if (this.paiguaBody) this.paiguaBody.innerHTML = '';
        
        // 清空解卦内容
        if (this.interpretationContent) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成抛掷起卦</p>';
        }
        
        // 切换到抛掷页面
        this.showSection('coin');
        
        console.log('应用已重置');
    }
}

// ==================== 初始化应用 ====================
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，初始化应用...');
    
    // 检查依赖
    if (typeof hexagramDatabase === 'undefined') {
        console.error('❌ hexagramDatabase未加载');
        alert('六爻数据库加载失败，请刷新页面重试');
        return;
    }
    
    if (typeof paiguaEngine === 'undefined') {
        console.warn('⚠️ paiguaEngine未加载，排卦功能受限');
    }
    
    if (typeof jieGuaEngine === 'undefined') {
        console.warn('⚠️ jieGuaEngine未加载，解卦功能受限');
    }
    
    app = new LiuYaoApp();
    window.app = app;
});