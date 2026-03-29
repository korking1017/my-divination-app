// 六爻算卦主应用 - 最终修复版
class LiuYaoApp {
    constructor() {
        console.log('六爻算卦应用初始化...');
        
        this.currentStep = 0;
        this.yaoValues = []; // 存储6爻的值
        this.coinResults = []; // 存储每爻的铜钱结果
        this.currentHexagram = null;
        this.paiguaResult = null;
        this.jieguaResult = null;
        
        // 修复：强制重置IndexedDB，避免旧数据问题
        this.resetIndexedDB();
        
        this.initElements();
        this.initEventListeners();
        this.updateDate();
        
        // 延迟加载历史记录，确保数据库初始化完成
        setTimeout(() => {
            this.loadHistory();
        }, 1000);
    }
    
    // 修复：强制重置IndexedDB
    resetIndexedDB() {
        if (!window.indexedDB) {
            console.warn('浏览器不支持IndexedDB，历史记录功能将受限');
            return;
        }
        
        console.log('清理旧版IndexedDB数据...');
        
        // 尝试删除可能存在的旧数据库
        const databases = ['LiuYaoDB', 'liuyao-v1', 'liuyao-v2', 'liuyao'];
        
        databases.forEach(dbName => {
            try {
                const deleteRequest = indexedDB.deleteDatabase(dbName);
                
                deleteRequest.onsuccess = () => {
                    console.log(`数据库 ${dbName} 删除成功`);
                };
                
                deleteRequest.onerror = (e) => {
                    console.log(`数据库 ${dbName} 删除失败:`, e.target?.error);
                };
                
                deleteRequest.onblocked = () => {
                    console.log(`数据库 ${dbName} 删除被阻止，请关闭其他标签页`);
                };
            } catch (error) {
                console.warn(`删除数据库 ${dbName} 时出错:`, error);
            }
        });
        
        // 清除localStorage中的相关数据
        try {
            localStorage.removeItem('liuyao_history');
            localStorage.removeItem('liuyao_current');
            localStorage.removeItem('liuyao_settings');
            console.log('localStorage数据已清除');
        } catch (e) {
            console.error('清除localStorage时出错:', e);
        }
    }
    
    initElements() {
        console.log('初始化DOM元素...');
        
        // 获取DOM元素
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
        
        // 卦象显示元素
        this.hexagramSection = document.getElementById('hexagramSection');
        this.benGuaNameEl = document.getElementById('benGuaName');
        this.benGuaDisplayEl = document.getElementById('benGuaDisplay');
        this.bianGuaBox = document.getElementById('bianGuaBox');
        this.bianGuaNameEl = document.getElementById('bianGuaName');
        this.bianGuaDisplayEl = document.getElementById('bianGuaDisplay');
        this.changingYaosEl = document.getElementById('changingYaos');
        this.shangGuaEl = document.getElementById('shangGua');
        this.xiaGuaEl = document.getElementById('xiaGua');
        
        // 注意：您的HTML中没有id为"changeInfo"的元素
        // 之前代码中使用了this.changeInfoEl，但HTML中没有对应元素
        // 这里将其设置为changingYaosEl，因为它们功能相似
        this.changeInfoEl = this.changingYaosEl;
        
        // 排卦表格
        this.paiguaSection = document.getElementById('paiguaSection');
        this.paiguaBody = document.getElementById('paiguaBody');
        
        // 解卦元素
        this.interpretationSection = document.getElementById('interpretationSection');
        this.interpretationContent = document.getElementById('interpretationContent');
        this.questionSelect = document.getElementById('questionSelect');
        
        // 历史记录元素
        this.historySection = document.getElementById('historySection');
        this.historyList = document.getElementById('historyList');
        
        // 导航
        this.navBtns = document.querySelectorAll('.nav-btn');
        
        // 验证关键元素
        this.validateCriticalElements();
        
        console.log('DOM元素初始化完成');
    }
    
    // 验证关键元素是否存在
    validateCriticalElements() {
        const criticalElements = [
            { name: 'coin1', el: this.coinElements[0] },
            { name: 'coinResult', el: this.coinResultEl },
            { name: 'tossBtn', el: this.tossBtn },
            { name: 'resetBtn', el: this.resetBtn },
            { name: 'benGuaName', el: this.benGuaNameEl },
            { name: 'benGuaDisplay', el: this.benGuaDisplayEl },
            { name: 'changingYaos', el: this.changingYaosEl },
            { name: 'paiguaBody', el: this.paiguaBody },
            { name: 'interpretationContent', el: this.interpretationContent },
            { name: 'historyList', el: this.historyList }
        ];
        
        let allValid = true;
        criticalElements.forEach(item => {
            if (!item.el) {
                console.error(`关键元素缺失: #${item.name}`);
                allValid = false;
            }
        });
        
        if (!allValid) {
            console.warn('部分关键元素缺失，应用可能无法正常工作');
        }
    }
    
    initEventListeners() {
        console.log('初始化事件监听器...');
        
        if (this.tossBtn) {
            this.tossBtn.addEventListener('click', () => this.tossCoins());
        } else {
            console.error('抛掷按钮不存在');
        }
        
        if (this.resetBtn) {
            this.resetBtn.addEventListener('click', () => this.reset());
        }
        
        // 导航点击
        this.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.showSection(section);
            });
        });
        
        // 问事类型变化
        if (this.questionSelect) {
            this.questionSelect.addEventListener('change', () => this.generateInterpretation());
        }
        
        // 添加到桌面提示关闭
        const closePrompt = document.getElementById('closePrompt');
        if (closePrompt) {
            closePrompt.addEventListener('click', () => {
                document.getElementById('installPrompt').style.display = 'none';
            });
        }
        
        console.log('事件监听器初始化完成');
    }
    
    updateDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
        const timeStr = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            dateDisplay.textContent = `${dateStr} ${timeStr}`;
        }
    }
    
    tossCoins() {
        if (this.currentStep >= 6) {
            console.warn('已抛掷6次，请点击重新开始');
            return;
        }
        
        console.log(`抛掷第${this.currentStep + 1}爻铜钱...`);
        
        // 抛掷动画
        this.coinElements.forEach((coin, index) => {
            if (!coin) {
                console.error(`铜钱元素coin${index + 1}不存在`);
                return;
            }
            
            coin.textContent = '';
            coin.classList.add('tossing');
            
            setTimeout(() => {
                const result = Math.random() < 0.6 ? 1 : 0; // 1=阳, 0=阴
                coin.textContent = result === 1 ? '●' : '〇';
                coin.classList.remove('tossing');
                
                // 存储结果
                if (!this.coinResults[this.currentStep]) {
                    this.coinResults[this.currentStep] = [];
                }
                this.coinResults[this.currentStep][index] = result;
                
                console.log(`铜钱${index + 1}: ${result === 1 ? '阳' : '阴'}`);
            }, index * 300);
        });
        
        // 延迟计算爻
        setTimeout(() => {
            this.calculateYao();
        }, 1000);
    }
    
    calculateYao() {
        const currentToss = this.coinResults[this.currentStep];
        if (!currentToss || currentToss.length !== 3) {
            console.error('铜钱结果异常:', currentToss);
            return;
        }
        
        const sum = currentToss.reduce((a, b) => a + b, 0);
        
        let yaoValue;
        let yaoText = '';
        
        if (sum === 3) { // 三个阳
            yaoValue = 9; // 老阳
            yaoText = '老阳 ●●● (变爻)';
        } else if (sum === 2) { // 两阳一阴
            yaoValue = 8; // 少阴
            yaoText = '少阴 ●●〇';
        } else if (sum === 1) { // 一阳两阴
            yaoValue = 7; // 少阳
            yaoText = '少阳 ●〇〇';
        } else { // 三个阴
            yaoValue = 6; // 老阴
            yaoText = '老阴 〇〇〇 (变爻)';
        }
        
        this.yaoValues[this.currentStep] = yaoValue;
        
        if (this.coinResultEl) {
            this.coinResultEl.textContent = `第${this.currentStep + 1}爻：${yaoText}`;
        }
        
        console.log(`第${this.currentStep + 1}爻结果: ${yaoText}, 数值: ${yaoValue}`);
        
        this.currentStep++;
        this.updateProgress();
        
        if (this.currentStep === 6) {
            console.log('六爻抛掷完成，开始生成卦象...');
            this.generateHexagram();
        }
    }
    
    updateProgress() {
        // 修复：确保currentStep不超过6
        if (this.currentStep > 6) {
            console.error('currentStep异常:', this.currentStep, '重置为6');
            this.currentStep = 6;
        }
        
        const progress = (this.currentStep / 6) * 100;
        
        if (this.progressFill) {
            this.progressFill.style.width = `${progress}%`;
        }
        
        if (this.currentYaoEl) {
            // 确保显示不会超过6
            const displayStep = Math.min(this.currentStep + 1, 6);
            this.currentYaoEl.textContent = displayStep;
        }
        
        if (this.currentStep === 6) {
            if (this.tossBtn) {
                this.tossBtn.disabled = true;
                this.tossBtn.textContent = '完成六爻';
            }
            if (this.resetBtn) {
                this.resetBtn.disabled = false;
            }
        }
    }
    
    generateHexagram() {
        console.log('=== 开始生成卦象 ===');
        console.log('原始爻值:', this.yaoValues);
        
        if (this.yaoValues.length !== 6) {
            console.error('爻值数量异常:', this.yaoValues.length);
            this.showErrorMessage('hexagramSection', '爻值数量异常，请重新抛掷');
            return;
        }
        
        try {
            // 1. 生成本卦和变卦二进制
            const { benGuaBinary, bianGuaBinary } = this.generateGuaBinary();
            
            // 2. 获取上下卦
            const shangGuaBinary = benGuaBinary.slice(3, 6).join('');
            const xiaGuaBinary = benGuaBinary.slice(0, 3).join('');
            
            console.log('上卦二进制(4-6爻):', shangGuaBinary);
            console.log('下卦二进制(1-3爻):', xiaGuaBinary);
            
            // 3. 查找卦名
            let benGuaData, bianGuaData;
            try {
                benGuaData = hexagramDatabase.findHexagram(shangGuaBinary, xiaGuaBinary);
                console.log('本卦查找结果:', benGuaData);
                
                const bianShangBinary = bianGuaBinary.slice(3, 6).join('');
                const bianXiaBinary = bianGuaBinary.slice(0, 3).join('');
                bianGuaData = hexagramDatabase.findHexagram(bianShangBinary, bianXiaBinary);
                console.log('变卦查找结果:', bianGuaData);
            } catch (error) {
                console.error('查找卦象时出错:', error);
                this.showErrorMessage('hexagramSection', '查找卦象时出错，请刷新页面重试');
                return;
            }
            
            // 4. 计算动爻
            const changingYaos = this.yaoValues.map((v, i) => 
                (v === 6 || v === 9) ? i + 1 : null
            ).filter(i => i !== null);
            
            this.currentHexagram = {
                benGua: {
                    binary: benGuaBinary,
                    shangGua: hexagramDatabase.getGuaName(shangGuaBinary) || '未知',
                    xiaGua: hexagramDatabase.getGuaName(xiaGuaBinary) || '未知',
                    name: benGuaData?.name || `${hexagramDatabase.getGuaName(shangGuaBinary)}上${hexagramDatabase.getGuaName(xiaGuaBinary)}下`,
                    number: benGuaData?.number || 0
                },
                bianGua: {
                    binary: bianGuaBinary,
                    name: bianGuaData?.name || '未知',
                    number: bianGuaData?.number || 0
                },
                changingYaos: changingYaos,
                yaoValues: [...this.yaoValues]
            };
            
            console.log('生成的卦象对象:', this.currentHexagram);
            
            // 5. 显示卦象
            this.displayHexagram();
            
            // 6. 切换页面到卦象显示
            this.showSection('hexagram');
            
            // 7. 延迟生成排卦，确保页面切换完成
            setTimeout(() => {
                console.log('开始排卦...');
                this.generatePaigua();
            }, 100);
            
        } catch (error) {
            console.error('生成卦象过程中出错:', error);
            this.showErrorMessage('hexagramSection', `生成卦象失败: ${error.message}`);
        }
    }
    
    // 生成卦象二进制数组
    generateGuaBinary() {
        const benGuaBinary = this.yaoValues.map(v => {
            if (v === 9 || v === 7) return 1; // 老阳、少阳
            if (v === 6 || v === 8) return 0; // 老阴、少阴
            return 0; // 默认
        });
        
        const bianGuaBinary = this.yaoValues.map(v => {
            if (v === 9) return 0; // 老阳变阴
            if (v === 6) return 1; // 老阴变阳
            if (v === 7) return 1; // 少阳不变
            if (v === 8) return 0; // 少阴不变
            return 0; // 默认
        });
        
        console.log('本卦二进制:', benGuaBinary);
        console.log('变卦二进制:', bianGuaBinary);
        
        return { benGuaBinary, bianGuaBinary };
    }
    
    displayHexagram() {
        console.log('显示卦象...');
        
        if (!this.currentHexagram || !this.currentHexagram.benGua) {
            console.error('没有卦象数据可显示');
            return;
        }
        
        const { benGua, bianGua, changingYaos = [] } = this.currentHexagram;
        
        // 显示本卦
        if (this.benGuaNameEl) {
            this.benGuaNameEl.textContent = benGua.name || '未知';
        }
        
        if (this.shangGuaEl && this.xiaGuaEl) {
            this.shangGuaEl.textContent = benGua.shangGua || '未知';
            this.xiaGuaEl.textContent = benGua.xiaGua || '未知';
        }
        
        // 绘制本卦
        if (this.benGuaDisplayEl) {
            this.benGuaDisplayEl.innerHTML = '';
            for (let i = 5; i >= 0; i--) {
                const yaoDiv = document.createElement('div');
                yaoDiv.className = 'yao-line';
                
                if (benGua.binary && benGua.binary[i] === 1) {
                    yaoDiv.classList.add('yao-yang');
                } else {
                    yaoDiv.classList.add('yao-yin');
                }
                
                if (changingYaos.includes(6 - i)) {
                    yaoDiv.classList.add('yao-changing');
                }
                
                this.benGuaDisplayEl.appendChild(yaoDiv);
            }
        }
        
        // 如果有变卦
        if (changingYaos.length > 0) {
            if (this.bianGuaBox) {
                this.bianGuaBox.style.display = 'block';
            }
            
            if (this.bianGuaNameEl) {
                this.bianGuaNameEl.textContent = bianGua.name || '未知';
            }
            
            // 绘制变卦
            if (this.bianGuaDisplayEl) {
                this.bianGuaDisplayEl.innerHTML = '';
                for (let i = 5; i >= 0; i--) {
                    const yaoDiv = document.createElement('div');
                    yaoDiv.className = 'yao-line';
                    
                    if (bianGua.binary && bianGua.binary[i] === 1) {
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
                this.changingYaosEl.textContent = `动爻：第${changingYaos.join('、')}爻`;
            } else {
                this.changingYaosEl.textContent = '无动爻（静卦）';
            }
        }
        
        console.log('卦象显示完成');
    }
    
    generatePaigua() {
        console.log('=== 开始排卦 ===');
        
        if (!this.currentHexagram) {
            console.error('没有卦象数据，无法排卦');
            this.showErrorMessage('paiguaBody', '请先完成抛铜钱生成卦象');
            return;
        }
        
        // 检查是否有变卦
        const hasChanging = this.currentHexagram.changingYaos && 
                           this.currentHexagram.changingYaos.length > 0;
        
        console.log(`卦象状态: ${hasChanging ? '有变卦' : '静卦'}, 动爻:`, 
                   this.currentHexagram.changingYaos);
        
        // 调用排卦引擎
        try {
            this.paiguaResult = paiguaEngine.generatePaigua(this.currentHexagram);
            
            if (!this.paiguaResult) {
                console.error('排卦引擎返回空结果');
                this.showErrorMessage('paiguaBody', '排卦失败，排卦引擎返回空结果');
                return;
            }
            
            if (!this.paiguaResult.yaoData || this.paiguaResult.yaoData.length === 0) {
                console.error('排卦结果中爻数据为空');
                this.showErrorMessage('paiguaBody', '排卦失败，爻数据为空');
                return;
            }
            
            console.log('排卦结果摘要:', {
                卦名: this.paiguaResult.guaInfo?.name || '未知',
                动爻数: this.paiguaResult.changingYaos?.length || 0,
                爻数据量: this.paiguaResult.yaoData?.length || 0
            });
            
            // 验证数据完整性
            this.validatePaiguaResult();
            
        } catch (error) {
            console.error('调用排卦引擎时出错:', error);
            this.showErrorMessage('paiguaBody', `排卦失败: ${error.message}`);
            return;
        }
        
        this.displayPaigua();
        
        // 自动保存到历史记录
        this.saveToHistory();
    }
    
    // 验证排卦结果
    validatePaiguaResult() {
        if (!this.paiguaResult || !this.paiguaResult.yaoData) {
            console.error('排卦结果验证失败：无数据');
            return false;
        }
        
        if (this.paiguaResult.yaoData.length !== 6) {
            console.warn(`排卦结果验证警告：爻数据数量异常 ${this.paiguaResult.yaoData.length}/6`);
            
            // 自动修复：补充缺失的爻数据
            this.fixMissingYaoData();
        }
        
        // 检查每个爻的关键数据
        let validCount = 0;
        for (let i = 0; i < this.paiguaResult.yaoData.length; i++) {
            const yao = this.paiguaResult.yaoData[i];
            if (yao && yao.positionName && yao.dizhi && yao.liuQin) {
                validCount++;
            } else {
                console.warn(`第${i + 1}爻数据不完整:`, yao);
            }
        }
        
        console.log(`爻数据验证: ${validCount}/6 条有效`);
        return validCount >= 4; // 至少4条有效数据
    }
    
    // 修复缺失的爻数据
    fixMissingYaoData() {
        if (!this.paiguaResult.yaoData) {
            this.paiguaResult.yaoData = [];
        }
        
        // 确保有6个爻
        for (let i = this.paiguaResult.yaoData.length; i < 6; i++) {
            this.paiguaResult.yaoData.push({
                position: i + 1,
                positionName: this.getYaoPositionName(i + 1),
                isYang: false,
                symbol: '未知',
                dizhi: this.getDefaultDiZhi(i + 1, i < 3),
                diZhiChar: '子',
                diZhiWuXing: '水',
                liuQin: '未知',
                shiYing: '',
                liuShen: '未知',
                wangShuai: { overall: '平' },
                isChanging: this.currentHexagram.changingYaos?.includes(i + 1) || false,
                isNeiGua: i < 3
            });
        }
        
        console.log('已修复缺失的爻数据');
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
    
    // 显示错误信息
    showErrorMessage(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<tr>
                <td colspan="7" style="text-align:center;color:#F44336;padding:20px;">
                    ⚠️ ${message}
                </td>
            </tr>`;
        } else {
            console.error(`找不到元素: ${elementId}`);
        }
    }
    
    displayPaigua() {
        console.log('=== 开始显示排卦 ===');
        console.log('排卦结果对象:', this.paiguaResult);
        console.log('爻数据:', this.paiguaResult?.yaoData);
        
        if (!this.paiguaResult || !this.paiguaResult.yaoData) {
            console.error('没有排卦数据可显示');
            this.showErrorMessage('paiguaBody', '排卦数据加载失败，请重新排卦');
            return;
        }
        
        if (!this.paiguaBody) {
            console.error('排卦表格body元素不存在');
            return;
        }
        
        this.paiguaBody.innerHTML = '';
        
        // 从初爻(1)到上爻(6)的顺序显示
        for (let i = 0; i < 6; i++) {
            const yaoData = this.paiguaResult.yaoData[i];
            
            if (!yaoData) {
                console.warn(`第 ${i + 1} 爻数据缺失，生成默认数据`);
                this.paiguaBody.appendChild(this.createDefaultYaoRow(i + 1, i));
                continue;
            }
            
            // 调试每个爻的数据
            if (i === 0) {
                console.log(`第 ${i + 1} 爻完整数据:`, yaoData);
            }
            
            // 使用正确的属性名
            const row = document.createElement('tr');
            
            // 获取爻位显示名称
            const positionName = yaoData.positionName || this.getYaoPositionName(yaoData.position) || 
                                this.getYaoPositionName(i + 1);
            
            // 获取爻象显示文本
            const yaoSymbol = this.getYaoSymbolText(yaoData.isYang, yaoData.isChanging);
            
            // 获取地支（兼容不同属性名）
            const dizhi = yaoData.dizhi || yaoData.diZhi || '未知';
            
            row.innerHTML = `
                <td>${positionName}</td>
                <td>${yaoSymbol}</td>
                <td>${dizhi}</td>
                <td>${yaoData.liuQin || '未知'}</td>
                <td>${yaoData.shiYing || ''}</td>
                <td>${yaoData.liuShen || '未知'}</td>
                <td>${yaoData.isChanging ? '动' : ''}</td>
            `;
            
            this.paiguaBody.appendChild(row);
        }
        
        console.log('排卦表格显示完成');
    }
    
    // 创建默认爻行
    createDefaultYaoRow(position, index) {
        const row = document.createElement('tr');
        const isChanging = this.currentHexagram?.changingYaos?.includes(position) || false;
        const isNeiGua = index < 3;
        
        row.innerHTML = `
            <td>${this.getYaoPositionName(position)}</td>
            <td>未知</td>
            <td>${this.getDefaultDiZhi(position, isNeiGua)}</td>
            <td>未知</td>
            <td></td>
            <td>未知</td>
            <td>${isChanging ? '动' : ''}</td>
        `;
        
        return row;
    }
    
    // 获取爻象显示文本
    getYaoSymbolText(isYang, isChanging) {
        if (isYang === undefined || isChanging === undefined) {
            return '未知';
        }
        
        if (isChanging) {
            return isYang ? '老阳' : '老阴';
        }
        return isYang ? '少阳' : '少阴';
    }
    
    generateInterpretation() {
        const questionType = this.questionSelect.value;
        if (!questionType) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先选择问事类型</p>';
            return;
        }
        
        if (!this.currentHexagram || !this.paiguaResult) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成排卦</p>';
            return;
        }
        
        // 获取性别
        const gender = document.querySelector('input[name="gender"]:checked')?.value || 'male';
        
        console.log('生成解卦，参数:', { questionType, gender });
        
        try {
            // 确保解卦引擎存在
            if (typeof jieGuaEngine === 'undefined') {
                throw new Error('解卦引擎未加载');
            }
            
            this.jieguaResult = jieGuaEngine.generateInterpretation(
                this.currentHexagram,
                this.paiguaResult,
                questionType,
                gender
            );
            
            this.displayInterpretation();
        } catch (error) {
            console.error('生成解卦时出错:', error);
            this.showDefaultInterpretation();
        }
    }
    
    displayInterpretation() {
        if (!this.jieguaResult) {
            this.showDefaultInterpretation();
            return;
        }
        
        let html = `
            <div class="interpretation-item">
                <h4>📊 总体运势</h4>
                <p>${this.jieguaResult.overall || '暂无解读'}</p>
            </div>
            
            <div class="interpretation-item">
                <h4>⚖️ 用神分析</h4>
                <p>${this.jieguaResult.yongShen || '暂无分析'}</p>
            </div>
            
            <div class="interpretation-item">
                <h4>🔄 五行生克</h4>
                <p>${this.jieguaResult.wuXing || '暂无分析'}</p>
            </div>
        `;
        
        if (this.jieguaResult.changingYaos && this.jieguaResult.changingYaos.length > 0) {
            html += `
                <div class="interpretation-item">
                    <h4>🌀 动爻解读</h4>
                    <p>${this.jieguaResult.changingYaoText || '暂无解读'}</p>
                </div>
            `;
        }
        
        if (this.jieguaResult.advice) {
            html += `
                <div class="interpretation-item">
                    <h4>💡 综合建议</h4>
                    <p>${this.jieguaResult.advice}</p>
                </div>
            `;
        }
        
        this.interpretationContent.innerHTML = html;
    }
    
    // 显示默认解卦
    showDefaultInterpretation() {
        const hexagramName = this.currentHexagram?.benGua?.name || '未知卦';
        const changingCount = this.currentHexagram?.changingYaos?.length || 0;
        
        this.interpretationContent.innerHTML = `
            <div class="interpretation-item">
                <h4>📊 卦象信息</h4>
                <p>卦名：${hexagramName}<br>
                   动爻数量：${changingCount}个<br>
                   卦象状态：${changingCount > 0 ? '有变卦' : '静卦'}</p>
            </div>
            
            <div class="interpretation-item">
                <h4>💡 解卦提示</h4>
                <p>解卦引擎暂时不可用，建议：<br>
                1. 查看排卦结果表格获取详细信息<br>
                2. 根据动爻位置分析变化趋势<br>
                3. 结合卦辞爻辞进行综合分析</p>
            </div>
        `;
    }
    
    showSection(sectionName) {
        console.log(`切换到页面: ${sectionName}`);
        
        // 确保所有区域存在
        const sections = ['coin', 'hexagram', 'paigua', 'interpretation', 'history'];
        sections.forEach(section => {
            const sectionEl = document.getElementById(`${section}Section`);
            if (sectionEl) {
                sectionEl.style.display = 'none';
            } else {
                console.warn(`找不到页面区域: ${section}Section`);
            }
        });
        
        // 显示目标区域
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            console.log(`成功显示 ${sectionName} 页面`);
        } else {
            console.error(`找不到目标页面: ${sectionName}Section`);
            // 回退到coin页面
            const fallbackSection = document.getElementById('coinSection');
            if (fallbackSection) {
                fallbackSection.style.display = 'block';
            }
        }
        
        // 更新导航按钮状态
        this.navBtns.forEach(btn => {
            if (btn.dataset.section === sectionName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
        // 如果是解卦区域且没有解卦数据，尝试生成
        if (sectionName === 'interpretation' && !this.jieguaResult && this.paiguaResult) {
            console.log('自动生成解卦...');
            setTimeout(() => {
                this.generateInterpretation();
            }, 100);
        }
    }
    
    reset() {
        console.log('重置应用状态...');
        
        this.currentStep = 0;
        this.yaoValues = [];
        this.coinResults = [];
        this.currentHexagram = null;
        this.paiguaResult = null;
        this.jieguaResult = null;
        
        // 重置UI
        this.coinElements.forEach(coin => {
            coin.textContent = '○';
        });
        
        if (this.coinResultEl) {
            this.coinResultEl.textContent = '等待抛掷...';
        }
        
        if (this.progressFill) {
            this.progressFill.style.width = '16.66%';
        }
        
        if (this.currentYaoEl) {
            this.currentYaoEl.textContent = '1';
        }
        
        if (this.tossBtn) {
            this.tossBtn.disabled = false;
            this.tossBtn.textContent = '抛掷铜钱';
        }
        
        if (this.resetBtn) {
            this.resetBtn.disabled = true;
        }
        
        // 清空卦象显示
        if (this.benGuaNameEl) this.benGuaNameEl.textContent = '';
        if (this.shangGuaEl) this.shangGuaEl.textContent = '';
        if (this.xiaGuaEl) this.xiaGuaEl.textContent = '';
        if (this.benGuaDisplayEl) this.benGuaDisplayEl.innerHTML = '';
        if (this.bianGuaBox) this.bianGuaBox.style.display = 'none';
        if (this.changingYaosEl) this.changingYaosEl.textContent = '';
        
        // 清空排卦表格
        if (this.paiguaBody) this.paiguaBody.innerHTML = '';
        
        // 清空解卦内容
        if (this.interpretationContent) {
            this.interpretationContent.innerHTML = '<p style="text-align:center;color:#666;">请先完成排卦并选择问事类型</p>';
        }
        
        if (this.questionSelect) {
            this.questionSelect.value = '';
        }
        
        this.showSection('coin');
        
        console.log('应用重置完成');
    }
    
    saveToHistory() {
        if (!this.currentHexagram || !this.paiguaResult) {
            console.log('无卦象数据，不保存历史记录');
            return;
        }
        
        const record = {
            id: Date.now(),
            date: new Date().toISOString(),
            hexagram: this.currentHexagram,
            paigua: this.paiguaResult,
            questionType: this.questionSelect.value || '未指定'
        };
        
        console.log('保存历史记录:', record);
        
        // 存储到IndexedDB
        this.saveRecordToDB(record);
        
        // 更新历史显示
        this.loadHistory();
    }
    
    // 修复：IndexedDB数据库初始化
    saveRecordToDB(record) {
        if (!window.indexedDB) {
            console.warn('浏览器不支持IndexedDB，历史记录功能不可用');
            return;
        }
        
        // 每次保存时都使用递增的版本号，确保数据库升级
        const DB_NAME = 'LiuYaoDB';
        const DB_VERSION = 4; // 增加到4，确保触发升级
        
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onupgradeneeded = (e) => {
            console.log('数据库需要升级/初始化，版本:', e.oldVersion, '->', e.newVersion);
            const db = e.target.result;
            
            // 如果 `records` 对象存储不存在，则创建它
            if (!db.objectStoreNames.contains('records')) {
                const objectStore = db.createObjectStore('records', {
                    keyPath: 'id',
                    autoIncrement: true
                });
                // 为按日期查询创建索引
                objectStore.createIndex('date', 'date', { unique: false });
                console.log('成功创建对象存储: records');
            } else {
                console.log('对象存储已存在，无需创建');
            }
        };
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            
            // 再次确认对象存储存在
            if (!db.objectStoreNames.contains('records')) {
                console.error('严重错误：对象存储仍未创建，放弃保存。');
                return;
            }
            
            const transaction = db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            
            const addRequest = store.add(record);
            addRequest.onsuccess = () => {
                console.log('历史记录保存成功。');
            };
            addRequest.onerror = (event) => {
                console.error('保存记录失败:', event.target.error);
            };
        };
        
        request.onerror = (e) => {
            console.error('打开数据库失败:', e.target.error);
        };
    }
    
    loadHistory() {
        if (!window.indexedDB || !this.historyList) {
            return;
        }
        
        const request = indexedDB.open('LiuYaoDB', 4);
        
        request.onsuccess = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('records')) {
                console.warn('对象存储不存在，显示空历史记录');
                this.displayHistory([]);
                return;
            }
            
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const getAllRequest = store.getAll();
            
            getAllRequest.onsuccess = (event) => {
                this.displayHistory(event.target.result);
            };
            
            getAllRequest.onerror = (event) => {
                console.error('获取历史记录失败:', event.target.error);
                this.displayHistory([]);
            };
        };
        
        request.onerror = (e) => {
            console.error('打开数据库失败:', e.target.error);
            this.displayHistory([]);
        };
    }
    
    displayHistory(records) {
        if (!this.historyList) return;
        
        if (!records || records.length === 0) {
            this.historyList.innerHTML = '<div class="no-history">暂无历史记录</div>';
            return;
        }
        
        // 按时间倒序排列
        records.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        this.historyList.innerHTML = records.map((record, index) => `
            <div class="history-item" data-index="${index}">
                <div class="history-item-date">
                    ${new Date(record.date).toLocaleString('zh-CN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
                <div class="history-item-gua">
                    ${record.hexagram?.benGua?.name || '未知卦'}
                    ${record.hexagram?.changingYaos && record.hexagram.changingYaos.length > 0 ? 
                      ` → ${record.hexagram?.bianGua?.name || '未知'} (${record.hexagram.changingYaos.length}动爻)` : 
                      ' (静卦)'}
                </div>
                <div class="history-item-question">
                    ${record.questionType === 'wealth' ? '问财运' : 
                      record.questionType === 'career' ? '问事业' : 
                      record.questionType === 'relationship' ? '问感情' : 
                      record.questionType === 'health' ? '问健康' : 
                      record.questionType === 'exam' ? '问考试' : 
                      record.questionType === 'others' ? '问其他' : '未指定'}
                </div>
            </div>
        `).join('');
        
        // 添加点击事件
        document.querySelectorAll('.history-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                this.loadFromHistory(records[index]);
            });
        });
    }
    
    loadFromHistory(record) {
        if (!record || !record.hexagram) {
            console.error('历史记录数据格式错误');
            return;
        }
        
        console.log('加载历史记录:', record);
        
        this.currentHexagram = record.hexagram;
        this.paiguaResult = record.paigua;
        
        // 显示卦象
        this.displayHexagram();
        
        // 显示排卦结果
        if (this.paiguaResult) {
            this.displayPaigua();
        }
        
        // 设置问事类型
        if (record.questionType && this.questionSelect) {
            this.questionSelect.value = record.questionType;
        }
        
        // 生成解卦结果
        if (record.questionType && this.paiguaResult) {
            try {
                this.jieguaResult = jieGuaEngine.generateInterpretation(
                    this.currentHexagram,
                    this.paiguaResult,
                    record.questionType
                );
                this.displayInterpretation();
            } catch (error) {
                console.error('从历史记录生成解卦时出错:', error);
                this.showDefaultInterpretation();
            }
        }
        
        this.showSection('hexagram');
    }
}

// 应用启动函数
function initializeApp() {
    console.log('=== 六爻算卦应用启动 ===');
    
    // 检查必要的库是否加载
    if (typeof hexagramDatabase === 'undefined') {
        console.error('错误: hexagramDatabase 未定义！');
        alert('六爻数据库加载失败，请刷新页面重试。');
        return null;
    }
    
    if (typeof paiguaEngine === 'undefined') {
        console.error('错误: paiguaEngine 未定义！');
        alert('排卦引擎加载失败，请刷新页面重试。');
        return null;
    }
    
    console.log('核心库加载成功，开始初始化应用...');
    
    try {
        const app = new LiuYaoApp();
        console.log('应用初始化完成');
        return app;
    } catch (error) {
        console.error('应用初始化失败:', error);
        alert(`应用启动失败: ${error.message}\n请查看控制台获取详细信息。`);
        return null;
    }
}

// 页面加载完成后初始化应用
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM加载完成，准备初始化应用...');
    
    // 延迟启动，确保所有资源加载完成
    setTimeout(() => {
        initializeApp();
    }, 100);
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LiuYaoApp, initializeApp };
} else {
    // 浏览器环境中，可以全局访问
    window.LiuYaoApp = LiuYaoApp;
    window.initializeApp = initializeApp;
}