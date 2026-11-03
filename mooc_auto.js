// ==UserScript==
// @name         mooc答题单元测试和课后小测试_3.0
// @namespace    http://tampermonkey.net/
// @version      3.0.2
// @description  慕课答题脚本（单元测试和课后小测试）
// @author       068
// @match        *://www.icourse163.org/learn/HPU-*
// @match        *://www.icourse163.org/mooc/learn/HPU-*
// @match        *://www.icourse163.org/spoc/learn/HPU-*
// @grant        none
// @downloadURL  https://raw.githubusercontent.com/laoliu-0/Auto_Mooc/main/mooc_auto.js
// @updateURL    https://raw.githubusercontent.com/laoliu-0/Auto_Mooc/main/mooc_auto.js
// ==/UserScript==
(function () {
        'use strict';
        // 检测更新 40.0
        let isRunning = true;
        // https://www.icourse163.org/front-mooc-learn/api/learn/content/unit-page?courseKey=HPU-1472974161&termId=1487925442&lessonId=1278434049&unitId=1320415076&entryMode=learn
        // https://www.icourse163.org/front-mooc-learn/api/learn/content/unit-page?courseKey=HPU-1472974161&termId=1487925442&lessonId=1278434049&unitId=1320415077&entryMode=learn
//-----------------------------------------------单元测试--------------------------------------------------//
        function wait(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }

        async function get_ans() {
            let m = window.location.href.match(/[?&]id=(\d+)/);
            console.log(`m:${m}`)
            let quizId = m ? m[1] : null;
            let page = 0;
            let list_aqs = []
            while (true) {
                let result = await fetch(`https://ginnnnnn.top/api/mooc/test/${quizId}?page=${page}&search=`)
                    .then(res => {
                        if (!res.ok) throw new Error('HTTP ' + res.status);
                        return res.json();
                    })
                    .then(data => {
                        console.log('请求成功:', data);
                        return data;
                    })
                    .catch(err => {
                        console.error('请求失败:', err);
                        return null;
                    });

                // 判断 result 是否有效
                if (!result || !result.data || !result.data.questionList) {
                    console.error('接口返回异常:', result);
                    return null;
                }

                let questionList = result.data.questionList;
                let totalPages = result.data.totalPages;
                for (let i = 0; i < questionList.length; i++) {
                    let list_aq = {
                        title: questionList[i].title.replace(/<[^>]*>/g, ""),
                        answer: [],
                        type: ""
                    };

                    let optionList = questionList[i].optionList;
                    list_aq.type = questionList[i].type
                    if (optionList && optionList.length > 0) {

                        for (let j = 0; j < optionList.length; j++) {
                            let option = optionList[j];
                            if (option.answer) {
                                list_aq.answer.push(option.content);
                            }
                        }
                        list_aqs.push(list_aq)
                        continue;
                    }

                    let stdAnswer = questionList[i].stdAnswer;
                    if (stdAnswer) {
                        let s = stdAnswer.match(/^[^#]*/)[0]
                        list_aq.answer = s;
                        list_aqs.push(list_aq)
                        continue;
                    }

                }
                if (page == totalPages - 1) {
                    console.log(list_aqs)
                    return list_aqs;
                }
                page += 1
            }

        }

        async function ans(qus, questionList) {

            for (let i = 0; i < questionList.length; i++) {
                let title = questionList[i].title;
                // 修改：qus 是数组，需要数组中的所有元素都包含在 title 中才算匹配
                let isMatch = true;
                for (let k = 0; k < qus.length; k++) {
                    console.log(`title${title};qus[k]:${qus[k]}`)
                    if (!title.includes(qus[k])) {
                        isMatch = false;
                        console.log("答案中不包含题目")
                        break;
                    }
                }
                if (isMatch) {
                    console.log(questionList[i])
                    return questionList.splice(i, 1)[0];
                }
            }

            console.log('未找到匹配题目:', qus);
            return null;
        }

        async function quses(questionList) {
            let choiceQue = document.querySelectorAll(".u-questionItem");
            console.log("正在运行，找到题目数量:", choiceQue.length);
            // choiceQue.length
            for (let i = 0; i < choiceQue.length; i++) {
                console.log("正在找答案，第", i + 1, "题");
                let ch = choiceQue[i];
                let title = ch.querySelector(".j-richTxt");
                if (!title) continue;

                let text = title.textContent.trim();
                console.log("题目文本:", text);

                // ✅ 修正：正则表达式不带引号
                text = text.replace(/<[^>]*>/g, "")
                text = text.replace(/&[a-zA-Z]+;/g, '');
                let m = text.match(/[\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）《》【】\-—…·,.;:!?()\[\]{}ⅥⅢⅠⅡⅣⅤⅦⅧⅨⅩⅪⅫ＋－×÷＝±≤≥≠≈∞∑∏√∫πΔθλμ°′″①②③④⑤⑥⑦⑧⑨⑩]+/g);

                if (!m) {
                    console.log("未提取到中文关键词");
                    continue;
                }

                // 取前几个字作为搜索关键词
                let keyword = m;
                console.log("搜索关键词:", keyword);

                let q_a = await ans(keyword, questionList);
                await wait(1000);
                await wait(Math.floor(Math.random() * 1500))

                // ✅ 判断 q_a 是否有效
                if (!q_a) {
                    console.log("未找到答案，跳过");
                    continue;
                }

                if (q_a.type === "SINGLE_CHOICE") {
                    let choices = ch.querySelectorAll("li[class*='f-cb']");
                    console.log("选项数量:", choices.length);

                    for (let j = 0; j < choices.length; j++) {
                        console.log("正在处理选项", j + 1);
                        await wait(500);

                        let choice_input = choices[j].querySelector("input");
                        let choice_text = choices[j].querySelector("p");
                        console.log(`单选->p->${choice_text}`)
                        if (!choice_text) {
                            choice_text = choices[j].querySelector(".f-fl.f-richEditorText.optionCnt.f-thide")
                            console.log(`单选->.f-fl.f-richEditorText.optionCnt.f-thide->`)
                            console.log(choice_text)
                        }
                        console.log(`${choice_input}+${choice_text}`)
                        if (!choice_input || !choice_text) continue;

                        for (let m = 0; m < q_a.answer.length; m++) {

                            let text_list = choice_text.textContent.trim().replace(/&[a-zA-Z]+;/g, '').match(/[\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）《》【】\-—…·,.;:!?()\[\]{}ⅥⅢⅠⅡⅣⅤⅦⅧⅨⅩⅪⅫ＋－×÷＝±≤≥≠≈∞∑∏√∫πΔθλμ°′″①②③④⑤⑥⑦⑧⑨⑩]+/g);
                            if (!text_list) continue;
                            console.log(`text_list-单选-${text_list}`)
                            console.log(`q_a.answer[m].trim()-单选-:${q_a.answer[m].trim()}`)
                            for (let x = 0; x < text_list.length; x++) {
                                console.log(`choice_text.textContent.trim():${text_list[x]}`)

                                if (q_a.answer[m].trim().includes(text_list[x])) {
                                    if (x == text_list.length - 1) {
                                        choice_input.click();
                                        console.log("已选择:", choice_text.textContent);
                                    }
                                } else {
                                    continue
                                }
                            }
                        }
                    }
                } else if (q_a.type === "COMPLETION") {
                    let choices = ch;
                    console.log("选项数量:", choices.length);

                    for (let j = 0; j < 1; j++) {
                        console.log("正在处理选项", j + 1);
                        await wait(500);

                        let choice_textarea = choices.querySelector("textarea");
                        let choice_label = choices.querySelector(".inputhint")
                        let choice_text = choices.querySelector("p");
                        if (!choice_text) {
                            choice_text = choices[j].querySelector(".f-fl.f-richEditorText.optionCnt.f-thide")
                        }
                        console.log(`${choice_textarea}+${choice_text}`)
                        if (!choice_textarea || !choice_text) continue;

                        for (let m = 0; m < 1; m++) {
                            if (q_a.answer.trim().includes("")) {
                                choice_label.click();
                                await wait(1000);
                                choice_textarea.value = q_a.answer.trim();
                                console.log("已写入:", choice_text.textContent);
                            }
                            break
                        }
                    }
                } else if (q_a.type === "JUDGEMENT") {
                    let choices = ch.querySelectorAll("li[class*='f-cb']");
                    console.log("选项数量:", choices.length);

                    for (let j = 0; j < choices.length; j++) {
                        console.log("正在处理选项", j + 1);
                        await wait(500);

                        let choice_input = choices[j].querySelector("input");
                        let choice_text = choices[j].querySelector("span");
                        console.log(`${choice_input}+${choice_text}`)
                        if (!choice_input || !choice_text) continue;

                        for (let m = 0; m < q_a.answer.length; m++) {
                            if (q_a.answer[m].trim().includes("正确") && choice_text.classList.contains("u-icon-correct")) {
                                choice_input.click();
                                console.log("已选择:正确");
                            } else if (q_a.answer[m].trim().includes("错误") && choice_text.classList.contains("u-icon-wrong")) {
                                choice_input.click();
                                console.log("已选择:错误");
                            }

                        }
                    }
                    // 多选题
                } else if (q_a.type === "MULTIPLE_CHOICE") {
                    let choices = ch.querySelectorAll("li[class*='f-cb']");
                    console.log("选项数量:", choices.length);

                    for (let j = 0; j < choices.length; j++) {
                        console.log("正在处理选项", j + 1);
                        await wait(500);

                        let choice_input = choices[j].querySelector("input");
                        let choice_text = choices[j].querySelector("p");
                        if (!choice_text) {
                            choice_text = choices[j].querySelector(".f-fl.f-richEditorText.optionCnt.f-thide")
                        }
                        console.log(`${choice_input}+${choice_text}`)
                        if (!choice_input || !choice_text) continue;

                        for (let m = 0; m < q_a.answer.length; m++) {
                            let text_list = choice_text.textContent.trim().replace(/&[a-zA-Z]+;/g, '').match(/[\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）《》【】\-—…·,.;:!?()\[\]{}ⅥⅢⅠⅡⅣⅤⅦⅧⅨⅩⅪⅫ＋－×÷＝±≤≥≠≈∞∑∏√∫πΔθλμ°′″①②③④⑤⑥⑦⑧⑨⑩]+/g);
                            console.log(`q_a.answer[m].trim()-多选-:${q_a.answer[m].trim()}`)
                            for (let x = 0; x < text_list.length; x++) {
                                console.log(`choice_text.textContent.trim():${text_list[x]}`)

                                if (q_a.answer[m].trim().includes(text_list[x])) {
                                    if (x == text_list.length - 1) {
                                        choice_input.click();
                                        console.log("已选择:", choice_text.textContent);
                                    }
                                } else {
                                    continue
                                }
                            }
                        }
                    }
                }
            }
        }

//----------------------------------------------------课后小测试-------------------------------------------//

        // 下一个x.x
        async function next_x_x() {
            let buttons = document.querySelectorAll(".flex.h-8.min-w-0.max-w-full.items-center")
            let button_1 = buttons[0];
            let button_2 = buttons[1];

            button_2.click();
            await wait(Math.floor(Math.random() * 1000 + 1000))

            let div_zi = document.querySelector(".overflow-y-auto")
            let button_zis = div_zi.querySelectorAll("button")
            for (let i = 0; i < button_zis.length; i++) {
                if (button_zis[i].classList.contains("bg-primary-50")) {
                    if (i != button_zis.length - 1) {
                        button_zis[i + 1].click();
                        return true
                    } else {
                        button_1.click()
                        await wait(Math.floor(Math.random() * 1000 + 1000))
                        let div_zi = document.querySelector(".overflow-y-auto")
                        let button_zis = div_zi.querySelectorAll("button")
                        for (let i = 0; i < button_zis.length; i++) {
                            if (button_zis[i].classList.contains("bg-primary-50")) {
                                if (i != button_zis.length - 1) {
                                    button_zis[i + 1].click();
                                    return true
                                } else {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 本项
        async function now_pro() {
            await wait(3000)
            let learn_unit = document.querySelector(".learn-unit-tabs-scroll");
            let buttons = learn_unit.querySelectorAll("button");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("text-[#00cc7e]")) {
                    let span = buttons[i].querySelector("span")
                    return span.textContent
                }
            }
        }

        // 是不是(看图标)
        function is_who() {
            let learn_unit = document.querySelector(".learn-unit-tabs-scroll");
            let buttons = learn_unit.querySelectorAll("button");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("text-[#00cc7e]")) {
                    let list_obj = [['M5 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.8 3a.7.7 0 0 1-1.2-.5V5a2 2 0 0 1 2-2Z', "讨论"], ['m7.5 7 2 2 3.5-3.5M7 12.5h6M7 15h3', "测试"]]
                    for (let j = 0; j < list_obj.length; j++) {
                        let path = buttons[i].querySelector(`path[d="${list_obj[j][0]}"]`)
                        if (path) {
                            return list_obj[j][1]
                        }
                    }
                }
            }
            return ""
        }

        // 下一项
        async function next_pro() {
            let learn_unit = document.querySelector(".learn-unit-tabs-scroll");
            let buttons = learn_unit.querySelectorAll("button");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("text-[#00cc7e]")) {
                    if (i != buttons.length - 1) {
                        buttons[i + 1].click();

                        return await now_pro()
                    } else {
                        let state = await next_x_x()
                        if (state) {
                            return await now_pro()
                        } else {
                            return false
                        }
                    }
                }
            }
        }

        // mooc小测试方面
        // 拿到题目和答案
        async function test_ans() {
            let href = window.location.href
            let courseKey = href.match(/HPU-(\d+)\//)?.[1]
            let tid = href.match(/tid=(\d+)/)?.[1]
            let lessonId = href.match(/content\/(\d+)/)?.[1]
            let unitId = href.match(/unitId=(\d+)/)?.[1]
            let result = await fetch(`https://www.icourse163.org/front-mooc-learn/api/learn/content/unit-page?courseKey=HPU-${courseKey}&termId=${tid}&lessonId=${lessonId}&unitId=${unitId}&entryMode=learn`)
                .then(res => {
                    if (!res.ok) throw new Error('HTTP' + res.status);
                    return res.json();
                })
                .then(data => {
                    console.log("请求成功:", 0);
                    return data;
                })
                .catch(err => {
                    console.error("请求失败:", err);
                });
            let quizData = result.result.quizData.questions;
            let a_qs = [];
            for (let i = 0; i < quizData.length; i++) {
                let a_q = {};
                a_q.title = quizData[i].title;
                a_q.correctOptionIds = quizData[i].correctOptionIds;
                a_q.answer = []
                a_q.type = quizData[i].type
                console.log(`a_q.title->${a_q.title}`)
                console.log(`a_q.type->${a_q.type}`)
                if (a_q.type == 1 || a_q.type == 2 || a_q.type == 4) {
                    let choices = quizData[i].options
                    for (let j = 0; j < a_q.correctOptionIds.length; j++) {
                        let correctOptionId = a_q.correctOptionIds[j];
                        for (let m = 0; m < choices.length; m++) {
                            let id = choices[m].id;
                            let label = choices[m].label;
                            if (id === correctOptionId) {
                                a_q.answer.push(label);
                            }
                        }
                    }
                    a_qs.push(a_q);
                } else if (a_q.type == 3) {
                    let ans_texts = quizData[i].correctAnswer
                    ans_texts = ans_texts.replace(/<[^>]*>/g, "")
                    console.log(`ans_texts->${ans_texts}`)
                    let ans_text = ans_texts.match(/^([^#]+)/)[1]
                    console.log(`ans_text->${ans_text}`)
                    a_q.answer.push(ans_text)
                    a_qs.push(a_q);
                }
            }
            console.log(a_qs)
            return a_qs;

        }

        // 提取汉语文本
        function get_chinese(text) {
            // console.log(text)
            text = text.replace(/<[^>]*>/g, "")
            text = text.replace(/&[a-zA-Z]+;/g, '')
            let m = text.match(/[\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）《》【】\-—…·,.;:!?()\[\]{}ⅥⅢⅠⅡⅣⅤⅦⅧⅨⅩⅪⅫ＋－×÷＝±≤≥≠≈∞∑∏√∫πΔθλμ°′″①②③④⑤⑥⑦⑧⑨⑩]+/g);
            if (!m) {
                console.log("未提取到中文关键词");
            }
            return m;
        }

        // 比对文并反馈对应的答案
        function contrast_text(fu_l, zi_l) {
            for (let i = 0; i < fu_l.length; i++) {
                let fu = fu_l[i].title
                fu = fu.replace(/<[^>]*>/g, "")
                let isMatch = true;
                for (let j = 0; j < zi_l.length; j++) {
                    if (!fu.includes(zi_l[j])) {
                        isMatch = false;
                        break
                    }
                }
                if (isMatch) {
                    return fu_l[i]
                }

            }
            return false
        }

        // 比对两个文本并反馈
        function contrast_text_text(fu, zi) {
            console.log(`比对两个文本并反馈:${zi}`)
            let zi_l = get_chinese(zi);
            fu = fu.replace(/<[^>]*>/g, "")
            console.log(`fu=>${fu},zi_l${zi_l}`)
            for (let i = 0; i < zi_l.length; i++) {
                if (!fu.includes(zi_l[i])) {
                    return false;
                }
            }
            return true;
        }

        // 测试 行动
        async function test_action() {
            await wait(Math.floor(Math.random() * 1000 + 1000))
            let button_circle = document.querySelectorAll(".inline-flex.items-center.justify-center")
            for (let i = 0; i < button_circle.length; i++) {
                if (button_circle[i].textContent === "重新答题") {
                    button_circle[i].click()
                    break
                }
            }

            await wait(Math.floor(Math.random() * 1000 + 1000))
            // 拿到所有的题目的容器
            let article = document.querySelectorAll("article");
            let buttons = document.querySelectorAll("button")
            let button = null;
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].textContent.trim() === "提交" || buttons[i].className === "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50 bg-primary-600 text-white hover:bg-primary-700 h-10 px-4 text-sm !text-white") {
                    button = buttons[i];
                    break
                }
            }
            // 循环去比对答案并点击
            let a_qs = await test_ans();
            for (let i = 0; i < article.length; i++) {
                console.log("选项题")
                await wait(3000);
                let ques_p = article[i].querySelector("p")
                if (!ques_p.textContent) {
                    ques_p = article[i].querySelector(".lesson-quiz-question-rich-text")
                    console.log(`lesson-quiz-question-rich-text=>${ques_p.textContent}`)
                }
                console.log(`lesson-quiz-question-rich-text=>${ques_p.textContent}`)
                let choice_labels = article[i].querySelectorAll("label")
                //选项
                let ans_p = []
                for (let j = 0; j < choice_labels.length; j++) {
                    ans_p.push(choice_labels[j].querySelector('.LessonQuizUnit_optionContent__8TTa7'))
                }

                let ques_text_list = get_chinese(ques_p.textContent);

                let choice_input_list = article[i].querySelectorAll("input")
                let a_q_ans = contrast_text(a_qs, ques_text_list)
                console.log(`a_q_ans->${a_q_ans}`)
                console.log(a_q_ans.type)
                console.log(a_q_ans.type == 3)
                if (a_q_ans) {
                    if (a_q_ans.type == 1 || a_q_ans.type == 2 || a_q_ans.type == 4) {
                        console.log(`我找到题目了:${ques_p.textContent}`)
                        let answer_list = a_q_ans.answer;
                        for (let m = 0; m < answer_list.length; m++) {
                            for (let n = 0; n < ans_p.length; n++) {
                                console.log(`我正在匹配答案`)
                                if (contrast_text_text(answer_list[m], ans_p[n].textContent)) {
                                    console.log(ans_p[n])
                                    choice_input_list[n].click();
                                    continue;
                                }
                            }
                        }
                    } else if (a_q_ans.type == 3) {
                        let ans_input = choice_input_list[0]
                        console.log(ans_input)
                        let answer_list = a_q_ans.answer;
                        console.log(`填空题->${answer_list[0]}`)
                        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                            window.HTMLInputElement.prototype, 'value'
                        ).set;

                        nativeInputValueSetter.call(ans_input, answer_list[0]);

// 触发事件
                        ans_input.dispatchEvent(new Event('input', {bubbles: true}));
                        ans_input.dispatchEvent(new Event('change', {bubbles: true}));
                        await wait(1000)

                    }
                }

            }
            if (button && isRunning) {
                button.click();
            }
        }

        //----------------------课件-----------------------//
        // 课件
        async function cla_action() {
            await wait(6000);
        }

        //----------------------讨论-----------------------//
        // 从别人的答案中拿答案
        async function talk_ans() {
            let href = window.location.href
            let courseKey = href.match(/HPU-(\d+)\//)?.[1]
            let tid = href.match(/tid=(\d+)/)?.[1]
            let lessonId = href.match(/content\/(\d+)/)?.[1]
            let unitId = href.match(/unitId=(\d+)/)?.[1]
            let result = await fetch(`https://www.icourse163.org/front-mooc-learn/api/learn/content/unit-page?courseKey=HPU-${courseKey}&termId=${tid}&lessonId=${lessonId}&unitId=${unitId}&entryMode=learn`)
                .then(res => {
                    if (!res.ok) throw new Error('HTTP' + res.status);
                    return res.json();
                })
                .then(data => {
                    console.log("请求成功:", 0);
                    return data;
                })
                .catch(err => {
                    console.error("请求失败:", err);
                });
            let replies = result.result.discussionData.replies
            let replie_max = 0
            let count = 0
            let content_text = null
            for (let i = 0; i < replies.length; i++) {
                if (replies[i].content.length > replie_max) {
                    content_text = replies[i].content
                    replie_max = replies[i].content.length
                    count++
                }
                if (count >= 3) {
                    return content_text
                }
            }
            return content_text
        }

        // 讨论
        async function talk_action() {
            let talk_ans_text = await talk_ans();
            if (talk_ans_text) {
                let editor = document.querySelector('.ql-editor');
                editor.innerHTML = `<p>${talk_ans_text}</p>`;
                // 触发 input 事件
                editor.dispatchEvent(new Event('input', {bubbles: true}));
                editor.dispatchEvent(new Event('change', {bubbles: true}));
                await wait(10000)
                let button = document.querySelector(".forum-reply-submit")
                if (button) {
                    button.click()
                }
                await wait(3000)
            } else {
                return
            }
        }

// ----------------------------------------------------spoc课后测试------------------------------------------------------//
        // hook拿答案
        function hookResponseText(xhr) {
            const origGetter = Object.getOwnPropertyDescriptor(
                XMLHttpRequest.prototype,
                'responseText'
            ).get;
            Object.defineProperty(xhr, 'responseText', {
                configurable: true,
                get() {
                    const text = origGetter.call(xhr);
                    try {
                        if (text && text.includes('paper')) {
                            window.__dwrRaw = text;
                            window.dispatchEvent(new CustomEvent('mooc-dwr-raw', {detail: text}))
                        }
                    } catch (e) {
                    }
                    return text;
                }
            });
        }

        function hook_ing() {
            const realOpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function (method, url) {
                this._moocUrl = (typeof url === 'string') ? url : "";

                return realOpen.apply(this, arguments);
            }
            const realSend = XMLHttpRequest.prototype.send;
            XMLHttpRequest.prototype.send = function () {
                const xhr = this;
                if (xhr._moocUrl && xhr._moocUrl.includes("getLessonUnitLearnVo.dwr")) {
                    hookResponseText(xhr);
                }
                return realSend.apply(this, arguments);
            }

        }

        function patchDwr() {
            hook_ing()
            if (window.dwr && dwr.engine && dwr.engine._remoteHandleCallback) {
                const orig = dwr.engine._remoteHandleCallback;
                dwr.engine._remoteHandleCallback = function (id, idx, data) {
                    if (data && data.paper) {
                        window.__dwrPaper = data.paper;
                        window.dispatchEvent(new CustomEvent('mooc-dwr-paper', {detail: data.paper}));
                        console.log('[MOOC]拿到 paper 数据');
                    }
                    return orig.apply(this, arguments);
                }
                console.log('[MOOC] dwr hook 成功');
            } else {
                setTimeout(patchDwr, 300);
            }
        }

// 下一个x.x
        async function spoc_next_x_x() {
            let buttons = document.querySelectorAll(".up.j-up")
            let button_1 = buttons[0];
            let button_2 = buttons[1];

            button_2.click();
            await wait(Math.floor(Math.random() * 1000 + 1000))

            let div_zi = document.querySelectorAll(".down.j-list")
            let button_zis = div_zi[1].querySelectorAll(".list")
            for (let i = 0; i < button_zis.length; i++) {
                let now_chapter_2 = button_2.textContent
                let now_c_2 = now_chapter_2.match(/^\S*/)[0]
                if (button_zis[i].title.includes(now_c_2)) {
                    if (i != button_zis.length - 1) {
                        button_zis[i + 1].click();
                        return true
                    } else {
                        button_1.click()
                        await wait(Math.floor(Math.random() * 1000 + 1000))
                        div_zi = div_zi[0]
                        let button_zis = div_zi.querySelectorAll(".list")
                        for (let i = 0; i < button_zis.length; i++) {
                            let now_chapter_1 = button_1.textContent
                            let now_c_1 = now_chapter_1.match(/^\S*/)[0]
                            if (button_zis[i].title.includes(now_c_1)) {
                                if (i != button_zis.length - 1) {
                                    button_zis[i + 1].click();
                                    div_zi = document.querySelectorAll(".down.j-list")
                                    button_zis = div_zi[1].querySelectorAll(".list")
                                    button_zis[0].click();
                                    patchDwr()

                                    return true
                                } else {
                                    return false;
                                }
                            }
                        }
                    }
                }
            }
        }

        // 本项
        async function spoc_now_pro() {
            await wait(3000)
            let learn_unit = document.querySelector(".unitslist");
            let buttons = learn_unit.querySelectorAll(":scope > .f-fl");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("current")) {
                    let text = buttons[i].title
                    return text
                }
            }
        }

        // 是不是(看图标)
        function spoc_is_who() {
            let learn_unit = document.querySelector(".learn-unit-tabs-scroll");
            let buttons = learn_unit.querySelectorAll("button");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("text-[#00cc7e]")) {
                    let list_obj = [['M5 3h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3.8 3a.7.7 0 0 1-1.2-.5V5a2 2 0 0 1 2-2Z', "讨论"], ['m7.5 7 2 2 3.5-3.5M7 12.5h6M7 15h3', "测试"]]
                    for (let j = 0; j < list_obj.length; j++) {
                        let path = buttons[i].querySelector(`path[d="${list_obj[j][0]}"]`)
                        if (path) {
                            return list_obj[j][1]
                        }
                    }
                }
            }
            return ""
        }

        // 下一项
        async function spoc_next_pro() {
            let learn_unit = document.querySelector(".unitslist");
            let buttons = learn_unit.querySelectorAll(":scope > .f-fl");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].classList.contains("current")) {
                    if (i != buttons.length - 1) {
                        buttons[i + 1].click();
                        patchDwr()

                        return await spoc_now_pro()
                    } else {
                        let state = await spoc_next_x_x()
                        if (state) {
                            return await spoc_now_pro()
                        } else {
                            return false
                        }
                    }
                }
            }
        }

        // mooc小测试方面

        // 拿到题目和答案
        // https://www.icourse163.org/dwr/call/plaincall/CourseBean.getLessonUnitLearnVo.dwr
        async function spoc_test_ans() {
            await wait(1500)
            if (!window.__dwrPaper || !window.__dwrPaper.objectiveQList) {
                console.error("还没拿到 paper 数据");
                return [];
            }
            let quizData = window.__dwrPaper.objectiveQList;
            let a_qs = [];
            for (let i = 0; i < quizData.length; i++) {
                let a_q = {};
                a_q.title = quizData[i].plainTextTitle;
                a_q.answer = []
                a_q.type = quizData[i].type
                console.log(`a_q.title->${a_q.title}`)
                console.log(`a_q.type->${a_q.type}`)
                if (a_q.type == 1 || a_q.type == 2 || a_q.type == 4) {
                    let choices = quizData[i].optionDtos
                    for (let j = 0; j < choices.length; j++) {
                        let isAnswer = choices[j].answer;
                        if (isAnswer) {
                            let id = choices[j].id;
                            a_q.answer.push(`_${id}`);
                        }
                    }
                    a_qs.push(a_q);
                } else if (a_q.type == 3) {
                    let ans_texts = quizData[i].correctAnswer
                    ans_texts = ans_texts.replace(/<[^>]*>/g, "")
                    console.log(`ans_texts->${ans_texts}`)
                    let ans_text = ans_texts.match(/^([^#]+)/)[1]
                    console.log(`ans_text->${ans_text}`)
                    a_q.answer.push(ans_text)
                    a_qs.push(a_q);
                }
            }
            console.log(a_qs)
            return a_qs;

        }

        // 提取汉语文本
        function spoc_get_chinese(text) {
            // console.log(text)
            text = text.replace(/<[^>]*>/g, "")
            text = text.replace(/&[a-zA-Z]+;/g, '');
            let m = text.match(/[\u4e00-\u9fa5a-zA-Z0-9，。！？、；：""''（）《》【】\-—…·,.;:!?()\[\]{}ⅥⅢⅠⅡⅣⅤⅦⅧⅨⅩⅪⅫ＋－×÷＝±≤≥≠≈∞∑∏√∫πΔθλμ°′″①②③④⑤⑥⑦⑧⑨⑩]+/g);
            if (!m) {
                console.log("未提取到中文关键词");
            }
            return m;
        }

        // 比对文并反馈对应的答案
        function spoc_contrast_text(fu_l, zi_l) {
            for (let i = 0; i < fu_l.length; i++) {
                let fu = fu_l[i].title
                fu = fu.replace(/<[^>]*>/g, "")
                let isMatch = true;
                for (let j = 0; j < zi_l.length; j++) {
                    if (!fu.includes(zi_l[j]) || zi_l[j].length + 3 < fu.length) {
                        isMatch = false;
                        break
                    }
                }
                if (isMatch) {
                    return fu_l[i]
                }

            }
            return false
        }

        // 比对两个文本并反馈
        function spoc_contrast_text_text(fu, zi) {
            console.log(`比对两个文本并反馈:${zi}`)
            let zi_l = spoc_get_chinese(zi);
            fu = fu.replace(/<[^>]*>/g, "")
            console.log(`fu=>${fu},zi_l${zi_l}`)
            for (let i = 0; i < zi_l.length; i++) {
                if (!fu.includes(zi_l[i])) {
                    return false;
                }
            }
            return true;
        }

        // 测试 行动
        async function spoc_test_action() {
            await wait(Math.floor(Math.random() * 1000 + 1000))
            // 注意这个点的是a
            let button_circle = document.querySelectorAll(".u-btn.u-btn-default.submit.j-replay")
            for (let i = 0; i < button_circle.length; i++) {
                if (button_circle[i].textContent === "重做") {
                    button_circle[i].click()
                    break
                }
            }

            await wait(Math.floor(Math.random() * 1000 + 1000))
            // 拿到所有的题目的容器
            let article = document.querySelectorAll(".m-choiceQuestion");
            let buttons = document.querySelectorAll(".j-submit")
            let button = null;
            // 找提交按钮
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].textContent.trim() === "提交" || buttons[i].className === "u-btn u-btn-default submit j-submit") {
                    button = buttons[i];
                    break
                }
            }
            // 循环去比对答案并点击
            let a_qs = await spoc_test_ans(); // 拿答案
            for (let i = 0; i < article.length; i++) {
                console.log("选项题")
                await wait(3000);
                // 题目
                let ques_p = article[i].querySelector("p")
                if (!ques_p.textContent) {
                    ques_p = article[i].querySelector(".rich-text-unit-renderer.lesson-quiz-question-rich-text.LessonQuizUnit_questionContent__tTSNy")
                    console.log(`lesson-quiz-question-rich-text=>${ques_p.textContent}`)
                }
                // 101589908294522
                console.log(`lesson-quiz-question-rich-text=>${ques_p.textContent}`)

                //
                // 整理问题
                let ques_text_list = spoc_get_chinese(ques_p.textContent);
                // 选项列表
                let choice_input_list = article[i].querySelectorAll("input")

                let a_q_ans = spoc_contrast_text(a_qs, ques_text_list)
                console.log(`a_q_ans->`)
                console.log(a_q_ans)
                console.log(a_q_ans.type)
                console.log(a_q_ans.type == 3)
                if (a_q_ans) {
                    if (a_q_ans.type == 1 || a_q_ans.type == 2 || a_q_ans.type == 4) {
                        console.log(`我找到题目了:${ques_p.textContent}`)
                        let answer_list = a_q_ans.answer;
                        for (let m = 0; m < answer_list.length; m++) {
                            for (let n = 0; n < choice_input_list.length; n++) {
                                console.log(`我正在匹配答案`)
                                console.log(choice_input_list[n])
                                console.log(answer_list[m])
                                if (choice_input_list[n].id.includes(answer_list[m])) {
                                    console.log(choice_input_list[n])
                                    // 点击选项按钮
                                    choice_input_list[n].click();
                                    continue;
                                }
                            }
                        }
                    } else if (a_q_ans.type == 3) {
                        let ans_input = choice_input_list[0]
                        console.log(ans_input)
                        let answer_list = a_q_ans.answer;
                        console.log(`填空题->${answer_list[0]}`)
                        let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                            window.HTMLInputElement.prototype, 'value'
                        ).set;

                        nativeInputValueSetter.call(ans_input, answer_list[0]);

// 触发事件
                        ans_input.dispatchEvent(new Event('input', {bubbles: true}));
                        ans_input.dispatchEvent(new Event('change', {bubbles: true}));
                        await wait(1000)

                    }
                }

            }
            if (button && isRunning) {
                button.click();
            }
        }

        //----------------------课件-----------------------//
        // 课件
        async function spoc_cla_action() {
            await wait(6000);
        }

        //----------------------讨论-----------------------//
        // 从别人的答案中拿答案
        async function spoc_talk_ans() {
            let m_data_lists = document.querySelector(".m-data-lists")
            let ans_lists = m_data_lists.querySelectorAll(":scope > div")
            let count = 0
            let text = null
            let n = 0
            for (let i = 0; i < ans_lists.length; i++) {
                let ans_text = ans_lists[i].querySelector(".f-richEditorText").textContent
                if (ans_text.length > count) {
                    count = ans_text.length
                    text = ans_text
                    n += 1
                }
                if (n > 3) {
                    return text
                }

            }

            return text
        }

        // 讨论
        async function spoc_talk_action() {
            let talk_ans_text = await spoc_talk_ans();
            if (talk_ans_text) {
                let editor = document.querySelector('.ql-editor');
                editor.innerHTML = `<p>${talk_ans_text}</p>`;
                // 触发 input 事件
                editor.dispatchEvent(new Event('input', {bubbles: true}));
                editor.dispatchEvent(new Event('change', {bubbles: true}));
                await wait(10000)
                let button = document.querySelector(".j-edit-btn.editbtn")
                if (button) {
                    button.click()
                }
                await wait(3000)
            } else {
                return
            }
        }

        // 启动器
        async function spoc_after_actions() {
            let name = await spoc_now_pro();
            name = ""
            while (true) {
                let talk_name = ""
                if (name.includes("视频")) {
                    console.log("视频没写")
                } else if (name.includes("文档")) {
                    await spoc_cla_action()
                } else if (name.includes("测试") || talk_name.includes("测试") || name.includes("测验")) {
                    await spoc_test_action()
                } else if (name.includes("讨论") || talk_name.includes("讨论")) {
                    await spoc_talk_action()
                } else {
                    await wait(5000)
                    console.log(`有一个模式你没写->${name}`)
                }
                if (!isRunning) break;
                await wait(2000)
                name = await spoc_next_pro()
                if (!name) {
                    return
                }
            }
        }

// ------------------------------------------------- 视频中答题 ------------------------------------------------------- //
        function get_video_time() {
            const video = document.querySelector('video')
            return Math.floor(video.currentTime)
        }

        function processResponse(text) {
            try {
                if (text && text.includes("anchors")) {
                    window.__video_text = JSON.parse(text);
                    window.dispatchEvent(new CustomEvent('mooc-video-qus'), {
                        detail: text
                    })
                }
            } catch (e) {
                console.log(e)
            }

        }

        function hooking() {
            const realFetch = window.fetch;
            window.fetch = async function (...args) {
                const url = typeof args[0] === 'string' ? args[0] : args.url;
                if (url && url.includes("unit-video-secondary")) {
                    const response = await realFetch.apply(this, arguments);
                    const clone = response.clone()
                    try {
                        const text = await clone.text()
                        processResponse(text)
                    } catch (e) {
                        console.log(`报错-》${e}`)
                    }

                    return response
                }
                return await realFetch.apply(this, arguments);
            }
        }

        function video_answer() {
            const anchors = window.__video_text.result.anchors
            let answer_list = []
            for (let i = 0; i < anchors.length; i++) {
                let payload = anchors[i].payload
                let answer_choice = {}
                answer_choice.type = payload.type
                answer_choice.ans = []
                let startTime = anchors[i].startTime
                answer_choice.startTime = startTime
                if ([1, 2, 4].includes(answer_choice.type)) {
                    let options = payload.options
                    for (let j = 0; j < options.length; j++) {
                        if (options[j].answer) {
                            let label = replace_text(options[j].label)
                            answer_choice.ans.push(label)
                        }
                    }
                    answer_list.push(answer_choice)
                } else if (answer_choice.type == 3) {
                    let stdAnswer = payload.stdAnswer;
                    if (stdAnswer) {
                        let s = stdAnswer.match(/^[^#]*/)[0]
                        answer_choice.ans.push([s])
                    }
                    answer_list.push(answer_choice)

                }
            }
            return answer_list
        }

        function choose_answer_near() {
            let ans_json = video_answer()
            let current_time = get_video_time()
            let t_t = 10000
            let t_m = null
            for (let i = 0; i < ans_json.length; i++) {
                let m = Math.abs(Number(current_time) - Number(ans_json[i].startTime))
                if (t_t > m) {
                    t_m = ans_json[i]
                    t_t = m
                }

            }
            return t_m
        }

        function choose_answer() {
            let ans_json = video_answer()
            let current_time = get_video_time()
            for (let i = 0; i < ans_json.length; i++) {
                if (ans_json[i].startTime == current_time) {
                    return ans_json[i]
                }
            }
            return choose_answer_near()
        }

        function replace_text(text) {
            return text
                .replace(/<[^>]*>/g, "")     // 去除HTML标签
                .replace(/&nbsp;/g, "")      // 去除所有 &nbsp;
                .replace(/;/g, "")           // 去除所有分号
                .replace(/ /g, "")           // 去除所有空格
                .trim();                     // 清理首尾
        }

        async function auto_video_ques() {
            let choices = document.querySelector(".mt-4")
            console.log("正在等待视频中的题目")
            if (choices) {
                let button = document.querySelector(".mt-7").querySelector("button")
                let label = choices.querySelectorAll("label")
                let input = choices.querySelectorAll("input")
                let answer_list = choose_answer()
                console.log(answer_list)
                if (answer_list.type == 3) {
                    input[0].click()
                    await wait(1000)
                    let nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                        window.HTMLInputElement.prototype, 'value'
                    ).set;

                    nativeInputValueSetter.call(input[0], answer_list.ans[0]);

// 触发事件
                    input[0].dispatchEvent(new Event('input', {bubbles: true}));
                    input[0].dispatchEvent(new Event('change', {bubbles: true}));
                    await wait(1000)

                } else {
                    for (let i = 0; i < label.length; i++) {
                        let choice_text = label[i].querySelector(".anchor-option-content").textContent
                        for (let j = 0; j < answer_list.ans.length; j++) {
                            choice_text = replace_text(choice_text)
                            console.log(`answer_list.ans[j]->${answer_list.ans[j]}`)
                            console.log(`choice_text->${choice_text}`)
                            if ([1, 2, 4].includes(answer_list.type)) {
                                if (answer_list.ans[j] == choice_text) {
                                    input[i].click()
                                    await wait(1000);
                                }
                            }
                        }

                    }
                }

                    await wait(1000)
                    button.click()
                    await wait(1000)
                    button = document.querySelector(".mt-7").querySelector("button")
                    await wait(1000)
                    button.click()
                    await wait(1000)
                    setTimeout(auto_video_ques, 5000)



            }
                        else
                {
                    setTimeout(auto_video_ques, 5000)
                }

        }


// --------------------------------------------------------------------------------------------------------------------//

        // 创建毛玻璃前端窗口
        // 创建毛玻璃前端窗口
        function createPanel() {
            // 创建容器
            let panel = document.createElement('div');
            panel.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 99999;
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 20px;
        padding: 24px;
        box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        font-family: 'Microsoft YaHei', sans-serif;
        min-width: 260px;
        color: #fff;
        cursor: move;
        user-select: none;
        transition: all 0.3s ease;
    `;

            // 添加背景装饰
            let decoration = document.createElement('div');
            decoration.style.cssText = `
        position: absolute;
        top: -50px;
        right: -50px;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
    `;
            panel.appendChild(decoration);

            // 标题
            let title = document.createElement('div');
            title.textContent = '🎓 MOOC答题助手';
            title.style.cssText = `
        font-size: 20px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 20px;
        text-align: center;
        text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        letter-spacing: 2px;
        background: linear-gradient(90deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    `;

            // 状态显示
            let status = document.createElement('div');
            status.id = 'mooc-status';
            status.textContent = '✨ 等待运行...';
            status.style.cssText = `
        font-size: 13px;
        color: rgba(10, 10, 10, 0.9);
        margin-bottom: 20px;
        text-align: center;
        min-height: 24px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        letter-spacing: 0.5px;
    `;

            // 是否视频内答题
            let is_video_ans = document.createElement('div');
            is_video_ans.id = 'is-video-ans';
            is_video_ans.style.cssText = `
    display: flex;
    align-items: center;      /* 垂直居中 */
    gap: 8px;                 /* 复选框和文字间距 */
    margin: 10px 0;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 8px;
`;
            let is_video_ans_pd = document.createElement("input");
            is_video_ans_pd.type = 'checkbox';
            is_video_ans_pd.id = 'video_ans_checkbox';
            is_video_ans_pd.value = "是否视频内答题"

            // 创建复选框后
            is_video_ans_pd.checked = localStorage.getItem('isVideoAns') === 'true';  // 读取上次状态，默认 false

// 监听变化并保存
            is_video_ans_pd.addEventListener('change', function () {
                localStorage.setItem('isVideoAns', this.checked);
                console.log('已保存状态:', this.checked);
                if (this.checked) {
                    alert("这个功能需要刷新页面才能生效")
                }
            });
            is_video_ans_pd.style.cssText = `
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #667eea;    /* 复选框选中颜色 */
    flex-shrink: 0;           /* 防止被压缩 */
`;
            let label_text = document.createElement('label')
            label_text.innerText = "是否视频内答题"
            label_text.style.cssText = `
    color: #000;
    font-size: 14px;
    cursor: pointer;
    user-select: none;
    line-height: 1;

`;

// 在脚本顶部声明全局变量
            let isVideoAnsEnabled = true;  // 默认值，对应 checked = true

// 创建复选框后绑定事件
            is_video_ans.appendChild(is_video_ans_pd)
            is_video_ans.appendChild(label_text)


            // 按钮通用样式
            function createButton(text, gradient, hoverGradient) {
                let btn = document.createElement('button');
                btn.textContent = text;
                btn.style.cssText = `
            display: block;
            width: 100%;
            padding: 12px 0;
            background: ${gradient};
            color: #fff;
            border: none;
            border-radius: 12px;
            cursor: pointer;
            font-size: 14px;
            margin-bottom: 12px;
            transition: all 0.3s ease;
            font-weight: 500;
            letter-spacing: 1px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            position: relative;
            overflow: hidden;
        `;

                // 添加悬停效果
                btn.onmouseover = () => {
                    btn.style.background = hoverGradient;
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
                };
                btn.onmouseout = () => {
                    btn.style.background = gradient;
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.2)';
                };

                return btn;
            }

            // 单元测试按钮
            let unitBtn = createButton(
                '📝 MOOC单元测试',
                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(135deg, #764ba2 0%, #667eea 100%)'
            );
            unitBtn.onclick = async function () {
                unitBtn.disabled = true;
                unitBtn.textContent = '⏳ 运行中...';
                status.textContent = '🔄 正在执行单元测试...';
                try {
                    let questionList = await get_ans();
                    await quses(questionList);
                    status.textContent = '✅ 单元测试完成！';
                } catch (err) {
                    console.error(err);
                    status.textContent = '❌ 执行失败';
                }
                unitBtn.disabled = false;
                unitBtn.textContent = '📝 单元测试';
            };

            // 课后小测试按钮
            let testBtn = createButton(
                '📚 MOOC课后小测试',
                'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)'
            );
            testBtn.onclick = async function () {
                testBtn.disabled = true;
                testBtn.textContent = '⏳ 运行中...';
                status.textContent = '🔄 正在执行课后小测试...';
                try {
                    await after_actions();
                    status.textContent = '✅ 课后小测试完成！';
                } catch (err) {
                    console.error(err);
                    status.textContent = '❌ 执行失败';
                }
                testBtn.disabled = false;
                testBtn.textContent = '📚 课后小测试';
            };

            // SPOC按钮
            let spocBtn0 = createButton(
                '📚 SPOC课后小测试',
                'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)'
            );
            spocBtn0.onclick = async function () {
                spocBtn0.disabled = true;
                spocBtn0.textContent = '⏳ 运行中...';
                status.textContent = '🔄 正在执行SPOC课后小测试...';
                try {
                    await spoc_after_actions();
                    status.textContent = '✅ SPOC课后小测试完成！';
                } catch (err) {
                    console.error(err);
                    status.textContent = '❌ SPOC执行失败';
                }
                spocBtn0.disabled = false;
                spocBtn0.textContent = '📚 SPOC课后小测试';
            };

            // 关闭按钮
            let closeBtn = document.createElement('button');
            closeBtn.textContent = '✕';
            closeBtn.style.cssText = `
display: block;
width: 100%;
padding: 8px;
margin-top: 10px;
background: rgba(255, 77, 79, 0.6);
color: #fff;
border: 1px solid rgba(255, 77, 79, 0.8);
border-radius: 8px;
cursor: pointer;
font-size: 13px;
text-align: center;
transition: all 0.3s;
    `;
            closeBtn.onmouseover = () => {
                closeBtn.style.background = 'rgba(255, 77, 79, 0.3)';
                closeBtn.style.color = '#fff';
            };
            closeBtn.onmouseout = () => {
                closeBtn.style.background = 'rgba(255, 77, 79, 0.6)';
                closeBtn.style.color = 'rgba(255, 255, 255, 0.6)';
            };
            closeBtn.onclick = () => {
                isRunning = false;
                panel.remove();
            };

            // 组装
            panel.appendChild(title);
            panel.appendChild(status);
            panel.appendChild(is_video_ans)
            panel.appendChild(unitBtn);
            panel.appendChild(testBtn);
            panel.appendChild(spocBtn0);
            panel.appendChild(closeBtn);

            // 添加到页面
            document.body.appendChild(panel);

            // ========== 拖拽功能 ==========
            let isDragging = false;
            let startX, startY, startLeft, startTop;

            panel.addEventListener('mousedown', function (e) {
                if (e.target.tagName === 'BUTTON') {
                    return;
                }
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = panel.getBoundingClientRect();
                startLeft = rect.left;
                startTop = rect.top;
                panel.style.cursor = 'grabbing';
                panel.style.transition = 'none';
                e.preventDefault();
            });

            document.addEventListener('mousemove', function (e) {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                let newLeft = startLeft + dx;
                let newTop = startTop + dy;
                const panelWidth = panel.offsetWidth;
                const panelHeight = panel.offsetHeight;
                const maxLeft = window.innerWidth - panelWidth;
                const maxTop = window.innerHeight - panelHeight;
                newLeft = Math.max(0, Math.min(newLeft, maxLeft));
                newTop = Math.max(0, Math.min(newTop, maxTop));
                panel.style.left = newLeft + 'px';
                panel.style.top = newTop + 'px';
                panel.style.right = 'auto';
            });

            document.addEventListener('mouseup', function () {
                if (isDragging) {
                    isDragging = false;
                    panel.style.cursor = 'move';
                    panel.style.transition = 'all 0.3s ease';
                }
            });
        }

        //----------------------课后启动器-----------------------//
        async function after_actions() {
            let name = await now_pro();
            name = ""
            while (true) {
                let talk_name = is_who()
                if (name.includes("视频")) {
                    console.log("视频没写")
                } else if (name.includes("课件")) {
                    await cla_action()
                } else if (name.includes("测试") || talk_name.includes("测试")) {
                    await test_action()
                } else if (name.includes("讨论") || talk_name.includes("讨论")) {
                    await talk_action()
                } else {
                    console.log(`有一个模式你没写->${name}`)
                }
                if (!isRunning) break;
                await wait(5000)
                name = await next_pro()
                if (!name) {
                    return
                }
            }
        }

        // ---------------------------------------------//
        // 页面加载后创建窗口
        window.addEventListener('load', function () {
            hook_ing()
            patchDwr()
            setTimeout(createPanel, 1000);
            if (localStorage.getItem('isVideoAns') === 'true') {
                hooking()
                setTimeout(auto_video_ques, 5000);
            }

        });

    }
)
();
//                    hook_ing()
//                     patchDwr()
