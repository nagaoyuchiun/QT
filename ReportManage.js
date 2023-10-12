import React, { useContext, useState, useEffect, useRef, forwardRef } from 'react';
import { useTranslation } from 'react-i18next'; //語系
import { useParams, useNavigate } from "react-router-dom";
import { MyUserContext } from '../contexts/MyUserContext';
import ReportChart from "../components/ReportChart";
import ReportDetail from "../components/ReportDetail";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import * as htmlToImage from 'html-to-image';
import { toPng } from 'html-to-image';
import Footer from './Footer';
import {
    apiGetTaskMailTitleList,
    apiGetShareReportUrl,
    apiSaveReportPaw,
    apiDownloadCSV,
    apiGetWatermark,
    apiSetWatermark,
    apiSetPdfpaw,
    apiDownloadPDF,
    apiGetTaskActionChart,
    apiGetBrowserType,
    apiGetActionChart,
    apiGetTaskDetails,
    apiGetSendMailDetail,
    apiGetActionDetail,
    apiGenerateAndDownloadPDF
} from "../utils/Api";
import Toast from "../components/ToastComponent";
import SimpleReactValidator from 'simple-react-validator';
import Parser from 'html-react-parser';
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";
import XLSX from 'xlsx';
import * as FileSaver from "file-saver";
import moment from 'moment';
//import DownloadPDF from "../components/DownloadPDF";
import Html from 'react-pdf-html';
import { PDFViewer, Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf, Font, Image } from '@react-pdf/renderer';
import MicrosoftBlack from '../fonts/MicrosoftBlack.ttf';
import MicrosoftBlackBold from '../fonts/MicrosoftBlack_bold.ttf';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, BarElement, CategoryScale, registerables } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import ChartDataLabels from "chartjs-plugin-datalabels";
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, ...registerables);

const ReportManage = (props) => {
    const navigate = useNavigate(); //跳轉Router
    const { togglePage, langSetting, socialInfo } = useContext(MyUserContext);
    const { t, i18n } = useTranslation();
    const { tab } = useParams();
    const [loading, setLoading] = useState(false); //是否載入
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const [chooseTab, setChooseTab] = useState(0); //選擇Tab頁籤 1:任務圖表 2:任務詳情
    const [modalStatus, setModalStatus] = useState(""); //顯示Modal

    const [currentDropdown, setCurrentDropdown] = useState(""); //目前選取下拉選單
    const [dropdownChecked, setDropdownChecked] = useState({
        taskStatus: [true, true, true], //任務狀態
        task: [] //任務列表
    }); //下拉選單是否打勾
    const [dropdownCheckedTxt, setDropdownCheckedTxt] = useState({
        taskStatus: t("ReportManage.taskStatus1"),
        task: t("ReportManage.chooseDrillTemplate")
    }); //下拉選單呈現文字
    const [taskStatus, setTaskStatus] = useState(["進行中", "已完成"]); //任務狀態列表
    const [taskListErr, setTaskListErr] = useState(0); //任務(您最多只能選擇 2 個任務)錯誤訊息

    const [needDisable, setNeedDisable] = useState(false);

    const [task, setTask] = useState([]);  //選擇的任務
    const [myTask, setMyTask] = useState([]);  //選擇的任務(為了部門反應的legend)
    const [shareReportGuid, setShareReportGuid] = useState("");  //Guid

    const [parentDropdownCheckedChart, setParentDropdownCheckedChart] = useState({ //下拉選單是否打勾(接收子層的行為等)
        behavior: [true, true, true, true, true, true], //行為
        company: [], //公司名單
        department: [], //部門名單
        department2: [] //部門2名單
    });

    const [parentChoiceIpList, setParentChoiceIpList] = useState([]); //IP列表(接收子層的)

    const [chkReportPaw, setChkReportPaw] = useState(false);  //設定報告密碼
    const [reportPaw, setReportPaw] = useState("");  //報告密碼
    const [reportPawErr, setReportPawErr] = useState(false);  //報告密碼錯誤訊息

    const [waterMark, setWaterMark] = useState({
        way: 0,     //方式 0:不使用 1:圖片 2:文字
        word: "",   //文字輸入
        size: 1,    //大小(10-20)(送出API乘10)
        layout: 1,  //版面 1:對角線 2:水平
        transparent: 0, //透明度(0-10)(送出API除10)
        isPhoto: false, //圖片是否要上傳(預設false)
        photo: null,   //圖片檔案(File)
        photoSrc: "" //圖片檔案
    }); //設定浮水印
    const [waterMarkWord, setWaterMarkWord] = useState(false);

    const [cropper, setCropper] = useState(null);
    const ref = useRef(null);
    const [divHeight, setDivHeight] = useState(0);
    const [saveCover, setSaveCover] = useState({
        photo: null,
        photoSrc: "",
        cropBox: "cropbox"
    }); //儲存資料

    const [reportPawDisabled, setReportPawDisabled] = useState(false); //設定報告密碼Disabled樣式
    const [downloadBtn, setDownloadBtn] = useState(false);//下載報告Disabled樣式
    const [downloadSetChk, setDownloadSetChk] = useState({
        downloadCSV: false,
        downloadPDF: false,
        reportPaw: false,
        paw: ""
    }); //下載報告打勾了那些
    const [downloadSetChkErr, setDownloadSetChkErr] = useState(false); //下載報告打勾了那些(錯誤訊息)

    const [copyTextShareReportURLClass, setCopyTextShareReportURLClass] = useState(""); //複製成功樣式(分享報告)
    const [copyTextShareReportClass, setCopyTextShareReportClass] = useState(""); //複製成功樣式(分享報告)
    const [copyTextDownloadReportClass, setCopyTextDownloadReportClass] = useState(""); //複製成功樣式(下載報告)

    //const [pdfHtml, setPdfHtml] = useState(null);
    const [runPDF, setRunPDF] = useState(false); //是否要執行PDF元件
    const [taskDetails, setTaskDetails] = useState(null); //取得任務狀態(ids)
    const [sendMailDetail, setSendMailDetail] = useState(null); //取得任務寄信狀態(ids)

    const [finishedBehaviorChart, setFinishedBehaviorChart] = useState(false); //使用者行為圖表API是否執行完畢
    const [finishedBehaviorImg, setFinishedBehaviorImg] = useState(""); //使用者行為圖表是否轉換成圖片
    const [behaviorChartData, setBehaviorChartData] = useState(null);

    const [finishedBrowerChart, setFinishedBrowerChart] = useState(false); //瀏覽器類型圖表API是否執行完畢
    const [finishedBrowerImg, setFinishedBrowerImg] = useState(""); //瀏覽器類型圖表是否轉換成圖片
    const [browerChartData, setBrowerChartData] = useState(null);


    const [finishedDaysBehaviorChart1, setFinishedDaysBehaviorChart1] = useState(false); //天數與行為圖表1API是否執行完畢
    const [finishedDaysBehaviorImg1, setFinishedDaysBehaviorImg1] = useState([]); //天數與行為圖表1是否轉換成圖片(物件)
    const [finishedDaysBehaviorImg1List, setFinishedDaysBehaviorImg1List] = useState([]); //天數與行為圖表1是否轉換成圖片(圖片)

    const [finishedDaysBehaviorChart2, setFinishedDaysBehaviorChart2] = useState(false); //天數與行為圖表2API是否執行完畢
    const [finishedDaysBehaviorImg2, setFinishedDaysBehaviorImg2] = useState([]); //天數與行為圖表2是否轉換成圖片(物件)
    const [finishedDaysBehaviorImg2List, setFinishedDaysBehaviorImg2List] = useState([]); //天數與行為圖表2是否轉換成圖片(圖片)

    const [finishedSectorResponseChart, setFinishedSectorResponseChart] = useState(false); //部門反應圖表API是否執行完畢
    const [finishedSectorResponseImg, setFinishedSectorResponseImg] = useState(""); //部門反應圖表是否轉換成圖片

    const [finishedDomainResponseChart, setFinishedDomainResponseChart] = useState(false); //域名反應圖表API是否執行完畢
    const [finishedDomainResponseImg, setFinishedDomainResponseImg] = useState(""); //域名反應圖表是否轉換成圖片

    const [finishedDetailResponse, setFinishedDetailResponse] = useState(false); //回應詳情API是否執行完畢
    const [finishedDetailResponseTable, setFinishedDetailResponseTable] = useState(null); //回應詳情

    const validator = new SimpleReactValidator({
        validators: {
            reportPawFormat: {
                rule: (val, params, validator) => {
                    const regex = new RegExp("^[a-zA-Z0-9]{6,10}$");
                    //console.log(regex.test(val));
                    return regex.test(val);
                },
            }
        },
        autoForceUpdate: this
    });

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            //console.log(window.location.origin);

            const sendData = {
                state: 0
            };
            let result = await ApiGetTaskMailTitleListFunc(sendData);
            let newDropdownChecked = { ...dropdownChecked };
            newDropdownChecked.task = result;
            setDropdownChecked(newDropdownChecked);
            setLoading(true);
        };
        fetchData();
    }, []);
    //#endregion

    function TestFunction() {
        const fetchData = async () => {

            const sendData = {
                ids: [28],
                company: [
                    "CCC",
                    "BBC",
                    "BBBBB",
                    "AAC",
                    ""
                ],
                department: [
                    "qweaa",
                    "KK",
                    "HHD",
                    "eee",
                    "CCD",
                    "BBD",
                    "BBD",
                    "AAD"
                ],
                department2: [
                    "CCD2",
                    "BBD2",
                    "BBD2",
                    "AAD2",
                    ""
                ],
                ipaddress: [],
                behaviorImg: "",
                browserImg: "",
                charts: [],
                password: ""
            };
            let result = await apiGenerateAndDownloadPDF(sendData);

            console.log(result);
        };


        fetchData();
    }

    useEffect(() => {
        const fetchData = async () => {
            if (dropdownChecked != null) {
                let newTask = dropdownChecked.task.filter(d => d.checked == true);
                let arryTask = [];
                let arryMyTask = [];
                for (let i = 0; i < newTask.length; i++) {
                    arryTask.push(newTask[i].ftc_id);
                    arryMyTask.push(newTask[i]);
                }

                setTask(arryTask);
                setMyTask(arryMyTask);
            }
        };
        fetchData();
    }, [dropdownChecked]);

    //#region 已發佈任務名稱列表API
    const ApiGetTaskMailTitleListFunc = async (sendData) => {
        let getTaskMailTitleListResponse = await apiGetTaskMailTitleList(sendData);
        //console.log("已發佈任務名稱列表", getTaskMailTitleListResponse);
        let result = [];

        if (getTaskMailTitleListResponse && getTaskMailTitleListResponse.code == "0000") {
            result = getTaskMailTitleListResponse.result;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getTaskMailTitleListResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    useEffect(() => {
        //console.log(tab);
        if (tab == "Chart") {
            setChooseTab(1);
            togglePage(6);
        }
        else if (tab == "Detail") {
            setChooseTab(2);
            togglePage(7);
        }
    }, [tab]);

    //#region 選擇Tab
    const clickTab = (e, tab) => {
        //setChooseTab(tab);
        if (tab == 1) {
            togglePage(6);
        }
        else if (tab == 2) {
            togglePage(7);
        }
        return false;
    }
    //#endregion

    //#region 打開下拉選單
    const handleDropdown = (e, dropdown) => {
        setCurrentDropdown(dropdown);
    }
    //#endregion

    //#region 離開下拉選單
    const handleBlurArea = (e, area) => {
        e.preventDefault();
        if (area == "dropdown") {
            setCurrentDropdown("");
            setTaskListErr(0);
        }
    }
    //#endregion

    //#region 打勾下拉選單
    const handleDropdownChecked = async (e, dropdown, index) => {
        let newDropdownChecked = { ...dropdownChecked };
        let newDropdownCheckedTxt = { ...dropdownCheckedTxt };

        if (dropdown == "taskStatus") { //任務狀態
            newDropdownChecked.taskStatus[index] = !newDropdownChecked.taskStatus[index];

            if (index == 0) { //代表全選或全部取消
                for (let i = 1; i < newDropdownChecked.taskStatus.length; i++) {
                    newDropdownChecked.taskStatus[i] = newDropdownChecked.taskStatus[index];
                }
            }
            else {
                if (newDropdownChecked.taskStatus[index] == false) { //代表有其中一個選項勾選掉代表全部要勾選掉
                    newDropdownChecked.taskStatus[0] = false;
                }
            }

            let filterNum = newDropdownChecked.taskStatus.filter(x => x == true).length;

            if (filterNum == 1) {
                let checkIndex = newDropdownChecked.taskStatus.findIndex(x => x == true);
                let checkName = taskStatus[checkIndex - 1];
                newDropdownCheckedTxt.taskStatus = (index == 0 ? t("ReportManage.taskStatus1") : `${checkName}`);
            }
            else {
                if (filterNum == newDropdownChecked.taskStatus.length || filterNum == newDropdownChecked.taskStatus.length - 1) {
                    newDropdownChecked.taskStatus[0] = true;
                    newDropdownCheckedTxt.taskStatus = t("ReportManage.taskStatus1");
                }
            }

            setTaskListErr(0);

            newDropdownCheckedTxt.task = t("ReportManage.chooseDrillTemplate");

            if (filterNum > 0) {
                let state = 0;
                if (newDropdownChecked.taskStatus[0] == false) {
                    state = newDropdownChecked.taskStatus[1] ? 1 : 2;
                }
                const sendData = {
                    state: state
                };
                let result = await ApiGetTaskMailTitleListFunc(sendData);
                newDropdownChecked.task = result;
            }
            else {
                newDropdownChecked.task = [];
                newDropdownCheckedTxt.task = t("ReportManage.chooseDrillTemplate");
            }
        }
        else { //任務
            let filterNum = newDropdownChecked.task.filter(x => x.checked == true).length;
            if (newDropdownChecked.task[index].checked == false) {
                filterNum += 1;
            }
            else {
                filterNum -= 1;
            }
            if (filterNum > 2) {
                setNeedDisable(true)
                //setTaskListErr(newDropdownChecked.task[index].ftc_id);
            }
            else if (filterNum == 2) {
                setNeedDisable(true)
                setTaskListErr(newDropdownChecked.task[index].ftc_id);
                newDropdownCheckedTxt.task = `${t("ReportManage.alreadyChoose")} (2)`;
                newDropdownChecked.task[index].checked = !newDropdownChecked.task[index].checked;
            }
            else if (filterNum == 1) {
                setNeedDisable(false)
                setTaskListErr(0);
                newDropdownChecked.task[index].checked = !newDropdownChecked.task[index].checked;
                let filterIndex = newDropdownChecked.task.findIndex(x => x.checked == true);
                if (filterIndex != -1) {
                    newDropdownCheckedTxt.task = newDropdownChecked.task[filterIndex].ftc_mailtitle;
                }
                else {
                    newDropdownCheckedTxt.task = newDropdownChecked.task[index].ftc_mailtitle;
                }
            }
            else {
                setNeedDisable(false)
                setTaskListErr(0);
                newDropdownCheckedTxt.task = t("ReportManage.chooseDrillTemplate");
                newDropdownChecked.task[index].checked = !newDropdownChecked.task[index].checked;
            }
        }

        setDropdownChecked(newDropdownChecked);
        setDropdownCheckedTxt(newDropdownCheckedTxt);
    }
    //#endregion

    //#region 分享報告
    const shareReport = async (e) => {
        e.preventDefault();
        if (task.length > 0) {
            let sendData = {
                ids: task
            };
            let result = await ApiGetShareReportUrlFunc(sendData);

            if (result != "") {
                setShareReportGuid(result);

                setChkReportPaw(false);
                setReportPaw("");
                setReportPawErr(false);
                setModalStatus("shareReport");
                //window.open(`/ShareReport/Chart/${result}`, '_blank');
            }
        }
    }
    //#endregion

    //#region 分享報告API
    const ApiGetShareReportUrlFunc = async (sendData) => {
        let guid = "";
        let getShareReportUrlResponse = await apiGetShareReportUrl(sendData);
        //console.log("分享報告", getShareReportUrlResponse);

        if (getShareReportUrlResponse && getShareReportUrlResponse.code == "0000") {
            guid = getShareReportUrlResponse.result;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getShareReportUrlResponse.message,
                time: 1500
            });
        }

        return guid;
    }
    //#endregion

    //#region 複製DNS Txt
    const copyText = (e, text, inputName) => {
        e.preventDefault();
        copyClipboard(text);

        if (inputName == "shareReport") {
            setCopyTextShareReportClass("success");
            setTimeout(() => {
                setCopyTextShareReportClass("");
            }, 2000);
        }
        else if (inputName == "url") {
            setCopyTextShareReportURLClass("success");
            setTimeout(() => {
                setCopyTextShareReportURLClass("");
            }, 2000);
        }
        else if (inputName == "downloadReport") {
            setCopyTextDownloadReportClass("success");
            setTimeout(() => {
                setCopyTextDownloadReportClass("");
            }, 2000);
        }
    }
    //#endregion

    //#region 複製文字功能
    const copyClipboard = (text) => {
        // navigator clipboard 需要https等安全上下文
        if (navigator.clipboard && window.isSecureContext) {
            // navigator clipboard 向剪贴板写文本
            return navigator.clipboard.writeText(text);
        } else {
            // 创建text area
            let textArea = document.createElement("textarea");
            textArea.value = text;
            // 使text area不在viewport，同时设置不可见
            textArea.style.position = "absolute";
            textArea.style.opacity = 0;
            textArea.style.left = "-999999px";
            textArea.style.top = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            return new Promise((res, rej) => {
                // 执行复制命令并移除文本框
                document.execCommand('copy') ? res() : rej();
                textArea.remove();
            });
        }
    }
    //#endregion

    //#region 隨機產生密碼
    const generateRandomChars = (e, funcName) => {
        e.preventDefault();
        const length = getRandomInt(6, 10);//取6-10任意位數
        var result = "";
        var make = 0;
        while (make < length) {
            var guid = generateGUID(result);
            make++;
            result += guid.slice(-1);
        }
        if (funcName == "shareReport") {
            setReportPaw(result);
        }
        else {
            let newDownloadSetChk = { ...downloadSetChk };
            newDownloadSetChk.paw = result;
            setDownloadSetChk(newDownloadSetChk);
        }
    };
    //#endregion
    //產生亂數值
    function generateGUID(fornew) {
        var chars = 'Aijklm45z01ox3EFRSTUVtuvwGH6yWXYZabc27BCDndefpqrsIJKLMNOPQgh89';
        if (chars != "") {
            chars = fornew + chars;
        }
        var timestamp = new Date().getTime();
        var guid = '';
        var index;

        while (timestamp > 0) {
            index = timestamp % chars.length;
            guid = chars.charAt(index * timestamp % 62) + guid;
            timestamp = Math.floor(timestamp / chars.length);
        }
        return guid;
    }
    //輸入欲想產生的最大最小值 - 中取亂數
    function getRandomInt(min, max) {
        // 使用當前時間產生亂數
        const seed = new Date().getTime();
        return Math.floor((seed % (max + 1 - min)) + min);
    }

    //#region 檢查密碼規則
    const cheekPaw = (e, event, modalName) => {
        const { name, value } = e.target;

        if (modalName == "shareReport") {
            if (event == "blur") {
                if (!validator.check(value, "required")) {
                    setReportPawErr(true);
                }
                else if (!validator.check(value, "reportPawFormat")) {
                    setReportPawErr(true);
                }
                else {
                    setReportPawErr(false);
                    setReportPaw(value);
                }
            }
            else {
                setReportPaw(value);
            }
        }
        else {
            if (event == "blur") {
                if (!validator.check(value, "required")) {
                    setDownloadSetChkErr(true);
                }
                else if (!validator.check(value, "reportPawFormat")) {
                    setDownloadSetChkErr(true);
                }
                else {
                    setDownloadSetChkErr(false);

                    let newDownloadSetChk = { ...downloadSetChk };
                    newDownloadSetChk.paw = value;
                    setDownloadSetChk(newDownloadSetChk);
                }
            }
            else {
                let newDownloadSetChk = { ...downloadSetChk };
                newDownloadSetChk.paw = value;
                setDownloadSetChk(newDownloadSetChk);
            }
        }
    }
    //#endregion

    //#region 儲存設定按鈕
    const saveReportPaw = async (e) => {
        e.preventDefault();
        if (!validator.check(reportPaw, "required")) {
            setReportPawErr(true);
        }
        else if (!validator.check(reportPaw, "reportPawFormat")) {
            setReportPawErr(true);
        }
        else {
            setReportPawErr(false);

            let sendData = {
                r_guid: shareReportGuid,
                r_paw: reportPaw
            };
            let result = await ApiSaveReportPawFunc(sendData);

            if (result) {
                setModalStatus("");
            }
        }
    }
    //#endregion

    //#region 儲存密碼設定API
    const ApiSaveReportPawFunc = async (sendData) => {
        let result = false;
        let saveReportPawResponse = await apiSaveReportPaw(sendData);
        //console.log("儲存密碼設定", saveReportPawResponse);

        if (saveReportPawResponse && saveReportPawResponse.code == "0000") {
            result = true;
            setToastObj({
                type: "success",
                msg: "儲存成功",
                time: 1500
            });
        }
        else {
            setModalStatus("");
            setToastObj({
                alert: "alert",
                type: "",
                msg: saveReportPawResponse.message,
                time: 1500
            });
            setTimeout(() => {
                setModalStatus("shareReport");
            }, 1500);
        }

        return result;
    }
    //#endregion

    //#region 設定浮水印按鈕
    const setReportWatermark = async (e) => {
        e.preventDefault();
        await ApiGetWatermarkFunc();
        setModalStatus("setReportWatermark");
    }
    //#endregion

    //#region 取得浮水印樣式API
    const ApiGetWatermarkFunc = async (behavior) => {
        let result = false;
        let getWatermarkResponse = await apiGetWatermark();
        //console.log("取得浮水印樣式", getWatermarkResponse);

        if (getWatermarkResponse && getWatermarkResponse.code == "0000") {
            let result = getWatermarkResponse.result;
            let newWaterMark = { ...waterMark };
            newWaterMark.way = result.w_way;
            newWaterMark.word = result.w_word;
            newWaterMark.size = result.w_size;
            newWaterMark.layout = result.w_layout;
            newWaterMark.transparent = result.w_transparent;
            newWaterMark.isPhoto = false;
            newWaterMark.photo = null;
            newWaterMark.photoSrc = result.w_photo;
            setWaterMark(newWaterMark);

            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getWatermarkResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    //#region 設定浮水印API
    const ApiSetWatermarkFunc = async (sendData) => {
        let result = false;
        let setWatermarkResponse = await apiSetWatermark(sendData);
        //console.log("設定浮水印", setWatermarkResponse);

        if (setWatermarkResponse && setWatermarkResponse.code == "0000") {
            result = true;
        }
        else {
            setModalStatus("");
            setToastObj({
                alert: "alert",
                type: "",
                msg: setWatermarkResponse.message,
                time: 1500
            });
            setTimeout(() => setModalStatus("setReportWatermark"), 1500);
        }

        return result;
    }
    //#endregion

    //#region 改變Input的欄位
    const handleChange = (e, behavior, modalName) => {
        const { name, value } = e.target;
        if (modalName == "watermark") {
            setWaterMarkWord(false);
            let newWaterMark = { ...waterMark };
            if (name == "watermarkKind") {
                if (behavior == "notUseWatermark") {
                    newWaterMark.way = 0;
                }
                else if (behavior == "imageWatermark") {
                    newWaterMark.way = 1;
                }
                else if (behavior == "textWatermark") {
                    newWaterMark.way = 2;
                }
            }
            else if (name == "transparency") {
                newWaterMark.transparent = value;
            }
            else if (name == "word") {
                newWaterMark.word = value;
            }
            else if (name == "size") {
                newWaterMark.size = value;
            }
            else if (name == "layout") {
                if (behavior == "diagonal") {
                    newWaterMark.layout = 1;
                }
                else if (behavior == "level") {
                    newWaterMark.layout = 2;
                }
            }

            setWaterMark(newWaterMark);
        }
        else {
            let newDownloadSetChk = { ...downloadSetChk };
            if (name == "downloadCSV") {
                newDownloadSetChk.downloadCSV = !newDownloadSetChk.downloadCSV;
            }
            else if (name == "downloadPDF") {
                newDownloadSetChk.downloadPDF = !newDownloadSetChk.downloadPDF;

                if (socialInfo && socialInfo.fu_service != 0) {
                    if (newDownloadSetChk.downloadPDF) {
                        setReportPawDisabled(false);
                    }
                    else {
                        setReportPawDisabled(true);
                    }
                }
            }
            else if (name == "reportPaw") {
                newDownloadSetChk.reportPaw = !newDownloadSetChk.reportPaw;
            }

            if (newDownloadSetChk.downloadCSV || newDownloadSetChk.downloadPDF) {
                setDownloadBtn(false)
            } else {
                setDownloadBtn(true)
            }

            setDownloadSetChk(newDownloadSetChk);
        }
    }
    //#endregion

    //#region 選擇圖片檔案
    const handleSelectBannerFile = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                let newSaveCover = { ...saveCover };
                newSaveCover.photo = event.target.files[0];
                newSaveCover.photoSrc = reader.result;
                newSaveCover.cropBox = "cropbox active";
                setSaveCover(newSaveCover);
            });
            reader.addEventListener('loadend', () => {
                event.target.value = "";
            });

            reader.readAsDataURL(event.target.files[0]);
        }
    }
    //#endregion

    //#region 共用-打開Modal
    const clickModal = async (e, behavior) => {
        e.preventDefault();

        if (behavior == "cropImg" && waterMark.way == 1) {
            setModalStatus("");
            const rawbody = document.querySelector('body');
            rawbody.classList.add('show-crop', 'loaded');

            let newSaveCover = { ...saveCover };
            newSaveCover.photo = null;
            newSaveCover.photoSrc = null;
            newSaveCover.cropBox = "cropbox";
            setSaveCover(newSaveCover);

            setCropper(null);
        }
    }
    //#endregion

    //#region Modal執行事件
    const clickModalComfire = async (e, behavior) => {
        e.preventDefault();

        if (behavior == "cropImgResult" || behavior == "cropImgCancel") {
            const rawbody = document.querySelector('body');
            rawbody.classList.remove('show-crop', 'loaded');
            setModalStatus("setReportWatermark");
        }
        else if (behavior == "setWaterMark") {

            if (waterMark.way == 2 && waterMark.word == "" || waterMark.word == null) {
                setWaterMarkWord(true)
            } else {
                const formData = new FormData();
                formData.append('way', waterMark.way);
                formData.append('word', waterMark.word);
                formData.append('size', waterMark.size * 10);
                formData.append('layout', waterMark.layout);
                formData.append('transparent', waterMark.transparent / 10);
                formData.append('photo', waterMark.photo);
                formData.append('isPhoto', waterMark.isPhoto);
                //let newWaterMark = { ...waterMark };
                //newWaterMark.size = newWaterMark.size * 10;
                //newWaterMark.transparent = newWaterMark.transparent / 10;
                ////console.log(newWaterMark);
                const result = await ApiSetWatermarkFunc(formData);
                if (result) {
                    setModalStatus("");
                }
            }
        }

        if (behavior == "cropImgResult") {
            if (saveCover.photo != null) {
                let newWaterMark = { ...waterMark };
                newWaterMark.isPhoto = true;
                newWaterMark.photo = saveCover.photo;
                newWaterMark.photoSrc = saveCover.photoSrc;
                setWaterMark(newWaterMark);
            }
            setModalStatus("setReportWatermark");
        }
    }
    //#endregion

    //#region 下載報告
    const downloadReport = (e) => {
        e.preventDefault();
        setReportPawDisabled(true); //設定報告密碼Disabled樣式
        setDownloadSetChkErr(false); //下載報告打勾了那些(錯誤訊息)

        if (socialInfo && socialInfo.fu_service != 0) {
            setReportPawDisabled(false);
            setDownloadSetChk({
                downloadCSV: true,
                downloadPDF: true,
                reportPaw: false,
                paw: ""
            });
        } else {
            setDownloadSetChk({
                downloadCSV: true,
                downloadPDF: false,
                reportPaw: false,
                paw: ""
            });
        }
        setModalStatus("downloadReport");
    }
    //#endregion

    //#region 下載報告確定按鈕
    const downloadReportConfirm = async (e) => {
        e.preventDefault();
        document.querySelector(".popup-loading").classList.add('active');


        if (downloadSetChk.downloadCSV) {
            let sendData = {
                ids: task
            };
            await ApiDownloadCSVFunc(sendData);
        }

        if (downloadSetChk.downloadPDF) {
            if (socialInfo && socialInfo.fu_service != 0) {
                await ApiGetWatermarkFunc();
            }

            setRunPDF(true);

            let sendData = {
                ids: task
            };
            ApiGetTaskDetailsFunc(sendData);
            ApiGetSendMailDetailFunc(sendData);

        }
    }
    //#endregion

    //#region 取得任務狀態(ids)API
    const ApiGetTaskDetailsFunc = async (sendData) => {
        let getTaskDetailsResponse = await apiGetTaskDetails(sendData);
        //console.log("取得任務狀態(ids)", getTaskDetailsResponse);

        if (getTaskDetailsResponse && getTaskDetailsResponse.code == "0000") {
            setTaskDetails(getTaskDetailsResponse.result);
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getTaskDetailsResponse.message,
                time: 1500
            });
        }
    }
    //#endregion

    //#region 取得任務寄信狀態(ids)API
    const ApiGetSendMailDetailFunc = async (sendData) => {
        let getSendMailDetailResponse = await apiGetSendMailDetail(sendData);
        //console.log("取得任務寄信狀態(ids)", getSendMailDetailResponse);

        if (getSendMailDetailResponse && getSendMailDetailResponse.code == "0000") {
            setSendMailDetail(getSendMailDetailResponse.result);
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getSendMailDetailResponse.message,
                time: 1500
            });
        }
    }
    //#endregion

    useEffect(() => {
        const fetchData = async () => {
            //console.log("===============");
            //console.log("taskDetails", taskDetails);
            //console.log("sendMailDetail", sendMailDetail);
            //console.log("finishedBehaviorChart", finishedBehaviorChart);
            //console.log("finishedBehaviorImg", finishedBehaviorImg ? finishedBehaviorImg.toBase64Image() : "");
            //console.log("browerChartData", browerChartData);
            //console.log("finishedBrowerChart", finishedBrowerChart);
            //console.log("finishedBrowerImg", finishedBrowerImg);
            //console.log("finishedDaysBehaviorChart1", finishedDaysBehaviorChart1);
            //console.log("finishedDaysBehaviorImg1", finishedDaysBehaviorImg1);
            //console.log("finishedSectorResponseChart", finishedSectorResponseChart);
            //console.log("finishedSectorResponseImg", finishedSectorResponseImg);
            //console.log("finishedDomainResponseChart", finishedDomainResponseChart);
            //console.log("finishedDomainResponseImg", finishedDomainResponseImg);
            //console.log("finishedDetailResponse", finishedDetailResponse);
            //console.log("finishedDetailResponseTable", finishedDetailResponseTable);
            //console.log("===============");
            if (finishedBehaviorChart && finishedBehaviorImg != null
                && finishedBrowerChart && finishedBrowerImg != null &&
                finishedDaysBehaviorChart1 && finishedDaysBehaviorImg1.length > 0 &&
                finishedSectorResponseChart && finishedSectorResponseImg.length > 0 &&
                finishedDomainResponseChart && finishedDomainResponseImg.length > 0) {
                document.querySelector(".popup-loading").classList.add('active');
                setTimeout(async () => {

                    let company = [];
                    let department = [];
                    let department2 = [];

                    if (parentDropdownCheckedChart) {
                        //公司
                        let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                        let stratIndex = 0;
                        if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                            stratIndex = 1;
                        }
                        for (let i = stratIndex; i < filterCompany.length; i++) {
                            company.push(filterCompany[i].name);
                        }

                        let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                        let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                        stratIndex = 0;
                        if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                            stratIndex = 1;
                        }
                        for (let i = stratIndex; i < filterDepartment.length; i++) {
                            department.push(filterDepartment[i].name);
                        }
                        stratIndex = 0;
                        if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                            stratIndex = 1;
                        }
                        for (let i = stratIndex; i < filterDepartment2.length; i++) {
                            department2.push(filterDepartment2[i].name);
                        }
                    }

                    let emptyArray = [];
                    if (finishedDaysBehaviorImg1) {
                        finishedDaysBehaviorImg1.forEach(function (val, ind) {
                            if (task.length == 2) {
                                let newarray = {
                                    title: `天數與行為  ${taskDetails[0].ftc_mailtitle}`,
                                    img: val.toBase64Image()
                                }
                                emptyArray.push(newarray)
                            } else {
                                let newarray = {
                                    title: `天數與行為`,
                                    img: val.toBase64Image()
                                }
                                emptyArray.push(newarray)
                            }
                        });
                    }
                    if (finishedDaysBehaviorImg2 && task.length == 2) {
                        finishedDaysBehaviorImg2.forEach(function (val, ind) {
                            let newarray = {
                                title: `天數與行為  ${taskDetails[1].ftc_mailtitle}`,
                                img: val.toBase64Image()
                            }
                            emptyArray.push(newarray)
                        }
                        );
                    }
                    if (finishedSectorResponseImg) {
                        for (const val of finishedSectorResponseImg) {
                            try {
                                const dataUrl = await htmlToImage.toPng(val);
                                let newarray = {
                                    title: `部門反應`,
                                    img: dataUrl
                                };
                                emptyArray.push(newarray);
                            } catch (error) {
                                console.error('Oops, something went wrong!', error);
                            }
                        }
                    }
                    if (finishedDomainResponseImg) {
                        finishedDomainResponseImg.forEach(function (val, ind) {
                            let newarray = {
                                title: `域名反應`,
                                img: val.toBase64Image()
                            }
                            emptyArray.push(newarray)
                        }
                        );
                    }

                    let sendData = {
                        ids: task,
                        company: company,
                        department: department,
                        department2: department2,
                        ipaddress: parentChoiceIpList,
                        behaviorImg: finishedBehaviorImg.toBase64Image(),
                        browserImg: finishedBrowerImg.toBase64Image(),
                        password: reportPaw,
                        charts: emptyArray
                    }

                    await ApiDownloadPDF(sendData);

                    //#region 全數重回預設值
                    setRunPDF(false);
                    setFinishedBehaviorChart(false);
                    setFinishedBehaviorImg("");
                    setBehaviorChartData(null);
                    setFinishedBrowerChart(false);
                    setFinishedBrowerImg("");
                    setBrowerChartData(null);
                    setFinishedDaysBehaviorChart1(false);
                    setFinishedDaysBehaviorImg1([]);
                    setFinishedDaysBehaviorImg1List([]);
                    setFinishedDaysBehaviorChart2(false);
                    setFinishedDaysBehaviorImg2([]);
                    setFinishedDaysBehaviorImg2List([]);
                    setFinishedSectorResponseChart(false);
                    setFinishedSectorResponseImg("");
                    setFinishedDomainResponseChart(false);
                    setFinishedDomainResponseImg("");
                    setFinishedDetailResponse(false);
                    setFinishedDetailResponseTable(null);
                    //#endregion

                }, "3000");
            }
        };
        fetchData();
    }, [finishedBehaviorChart, finishedBehaviorImg,
        finishedBrowerChart, finishedBrowerImg, finishedDaysBehaviorChart1, finishedDaysBehaviorImg1,
        finishedDaysBehaviorChart2, finishedDaysBehaviorImg2,
        finishedSectorResponseChart, finishedSectorResponseImg,
        finishedDomainResponseChart, finishedDomainResponseImg
    ]);

    async function GeneratePDF() {
        // Register Font
        Font.register({
            family: "MicrosoftBlack",
            src: MicrosoftBlack,
        });

        Font.register({
            family: "MicrosoftBlackBold",
            src: MicrosoftBlackBold,
        });

        // Create style with font-family
        const styles = StyleSheet.create({
            page: {
                fontFamily: "MicrosoftBlack",
                margin: 0,
                backgroundColor: "#F7F9FD",
                padding: "20px 30px",
                margin: "0 auto",
                overflow: "hidden",
                border: 0,
                flexGrow: 1,
                position: "relative"
            },
            body: {
                flexGrow: 1,
            },
            fzA: {
                marginBottom: 8,
                display: "block",
                lineHeight: "1.125em",
                color: "#1672AD",
                fontSize: 16
            },
            fzABold: {
                fontFamily: "MicrosoftBlackBold",
                marginBottom: 8,
                display: "block",
                lineHeight: "1.125em",
                color: "#1672AD",
                fontSize: 16
            },
            row: {
                flexGrow: 1,
                flexDirection: 'row',
                zIndex: 1
            },
            col: {
                flexDirection: 'column',
                flex: 1
            },
            fontSize10: {
                fontSize: '10px'
            },
            fontSize8: {
                fontSize: '8px'
            },
            cardBlue: {
                backgroundColor: "#3780C4",
                borderRadius: 16,
                color: "#fff",
                padding: 10,
                height: 180
            },
            bgWhite: {
                backgroundColor: "#fff",
                paddingTop: 15,
                paddingBottom: 15,
                border: "1px solid #BDBDBD",
                borderRadius: 16
            },
            w100: {
                width: "100%",
                backgroundColor: "red",
            },
            w50: {
                width: "50%"
            },
            w55: {
                width: "55%"
            },
            w45: {
                width: "45%"
            },
            w35: {
                width: "40%"
            },
            w65: {
                width: "60%"
            },
            w10: {
                width: "10%"
            },
            w90: {
                width: "90%"
            },
            margin10: {
                margin: 10
            },
            marginBottom8: {
                marginBottom: 8
            },
            marginBottom4: {
                marginBottom: 4
            },
            marginLeft8: {
                marginLeft: 3
            },
            padding10: {
                padding: 15
            },
            fzC: {
                fontSize: 14,
                fontWeight: 500,
                lineHeight: "1.25em",
                color: "#1672AD",
                display: "block"
            },
            fcNormal: {
                fontSize: 14,
                lineHeight: "1.5em"
            },
            fontSize12: {
                fontSize: 12
            },
            printTableTH: {
                backgroundColor: "#C9E5F6",
                color: "#243B53",
                paddingVertical: 4,
            },
            flex5: {
                color: "#243B53",
                flexShrink: 0,
                minWidth: 4,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                flex: 5
            },
            flex4: {
                color: "#243B53",
                flexShrink: 0,
                minWidth: 4,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                flex: 4
            },
            flex2: {
                color: "#243B53",
                flexShrink: 0,
                minWidth: 4,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                flex: 2
            },
            flex3: {
                color: "#243B53",
                flexShrink: 0,
                minWidth: 4,
                fontSize: "0.875rem",
                display: "flex",
                alignItems: "center",
                flex: 3
            },
            table: {
                flexDirection: 'row',
                flexWrap: "wrap"
            },
            tableHeader: {
                backgroundColor: "#C9E5F6",
                color: "#243B53",
                paddingVertical: 4,
                borderBottom: 1
            },
            tableRow: {
                flexDirection: 'row',
                flexWrap: "wrap",
                borderBottom: 1,
                marginTop: 10
            },
            tableCell5: {
                flex: 5,
                fontSize: 8,
                justifyContent: 'left'
            },
            tableCell4: {
                flex: 4,
                fontSize: 8,
                justifyContent: 'left'
            },
            tableCell2: {
                flex: 2,
                fontSize: 8,
                justifyContent: 'left'
            },
            tableCell3: {
                flex: 3,
                fontSize: 8,
                justifyContent: 'left'
            },
            textAlignCenter: {
                textAlign: 'center'
            },
            bgRed: {
                backgroundColor: 'red'
            },
            bgOrange: {
                backgroundColor: 'orange'
            },
            bgGreen: {
                backgroundColor: 'green'
            },
            bgYellow: {
                backgroundColor: 'yellow'
            },
            bgPurple: {
                backgroundColor: 'purple'
            },
            bgBlue: {
                backgroundColor: 'blue'
            },
            bgLinen: {
                backgroundColor: 'linen'
            },
            bgPeru: {
                backgroundColor: 'peru'
            },
            bgWheat: {
                backgroundColor: 'wheat'
            },
            fColorBlack: {
                color: '#243B53'
            },
            zIndex1: {
                zIndex: 1
            },
            waterMarkText: {
                position: 'absolute',
                left: '0px',
                top: "50%",
                marginHorizontal: 'auto',
                textAlign: "center",
                justifyContent: 'center',
                display: 'block',
                width: '115%',
                transform: `scale(${waterMark.size + 1}) rotate(${waterMark.layout == 1 ? 45 : 0}deg)`,
                color: "rgba(189, 189, 189, 0.5)",
                fontSize: 40,
                zIndex: -1
            },
            waterMarkImage: {
                position: 'absolute',
                display: 'block',
                height: 'auto',
                width: '70%',
                left: "20%",
                top: "40%",
                opacity: 0.2,
                zIndex: -1
            },
            fWBold: {
                fontFamily: "MicrosoftBlackBold",
                color: '#243B53'
            },
            fWBold2: {
                fontFamily: "MicrosoftBlackBold"
            },
            colorA: {
                top: 3,
                width: 8,
                height: 4,
                backgroundColor: "#78A8FF",
                marginLeft: 1,
                paddingTop: 3
            },
            colorB: {
                top: 3,
                width: 8,
                height: 4,
                backgroundColor: "#FFC700",
                marginLeft: 1,
                paddingTop: 3
            },
            colorC: {
                top: 3,
                width: 8,
                height: 4,
                backgroundColor: "#38D7E7",
                marginLeft: 1,
                paddingTop: 3
            },
            colorD: {
                top: 3,
                width: 8,
                height: 4,
                backgroundColor: "#FF6F3D",
                marginLeft: 1,
                paddingTop: 3
            },
            colorE: {
                top: 3,
                width: 8,
                height: 4,
                backgroundColor: "#AFD7F1",
                marginLeft: 1,
                paddingTop: 3
            },
            textSmall: {
                fontSize: 8,
                justifyContent: 'flex-end',
                flexDirection: 'row'
            },
            textRight: {
                justifyContent: 'flex-end',
                flexDirection: 'row'
            }
        });

        let emptyArray = [];
        if (finishedDaysBehaviorImg1) {
            finishedDaysBehaviorImg1.forEach(function (val, ind) {
                if (task.length == 2) {
                    let newarray = {
                        title: `天數與行為  ${taskDetails[0].ftc_mailtitle}`,
                        img: val.toBase64Image()
                    }
                    emptyArray.push(newarray)
                } else {
                    let newarray = {
                        title: `天數與行為`,
                        img: val.toBase64Image()
                    }
                    emptyArray.push(newarray)
                }
            });
        }
        if (finishedDaysBehaviorImg2 && task.length == 2) {
            finishedDaysBehaviorImg2.forEach(function (val, ind) {
                let newarray = {
                    title: `天數與行為  ${taskDetails[1].ftc_mailtitle}`,
                    img: val.toBase64Image()
                }
                emptyArray.push(newarray)
            }
            );
        }
        if (finishedSectorResponseImg) {
            for (const val of finishedSectorResponseImg) {
                try {
                    const dataUrl = await htmlToImage.toPng(val);
                    let newarray = {
                        title: `部門反應`,
                        img: dataUrl
                    };
                    emptyArray.push(newarray);
                } catch (error) {
                    console.error('Oops, something went wrong!', error);
                }
            }


            //finishedSectorResponseImg.forEach(function (val, ind) {

            //    const dataUrl = await htmlToImage.toPng(val);

            //    //htmlToImage.toPng(val)
            //    //    .then(function (dataUrl) {

            //    //    })
            //    //    .catch(function (error) {
            //    //        console.error('oops, something went wrong!', error);
            //    //    });

            //    let newarray = {
            //        title: `部門反應`,
            //        img: dataUrl
            //    }
            //    emptyArray.push(newarray)

            //    //let newarray = {
            //    //    title: `部門反應`,
            //    //    img: val.toBase64Image()
            //    //}
            //    //emptyArray.push(newarray)
            //});
        }
        if (finishedDomainResponseImg) {
            finishedDomainResponseImg.forEach(function (val, ind) {
                let newarray = {
                    title: `域名反應`,
                    img: val.toBase64Image()
                }
                emptyArray.push(newarray)
            }
            );
        }

        //產生PDF
        const blob = await pdf(
            <Document>
                <Page size="A4" style={styles.page} wrap={true}>
                    <Text style={[styles.fzA, styles.fWBold]}>演練報告</Text>
                    <View style={[styles.row, styles.fontSize10, styles.marginBottom4]}>
                        <View style={styles.col}>
                            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                {
                                    Array.from(taskDetails[0].ftc_mailtitle).map((char) => <Text style={[styles.fWBold, styles.marginBottom4]}>{char}</Text>)
                                }
                            </View>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>開始時間： {taskDetails[0].ftc_startingtime}</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>結束時間： {taskDetails[0].ftc_endingtime}</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>任務期間： {taskDetails[0].days} days</Text>
                            {(() => {
                                if (task.length > 0 && taskDetails && taskDetails.length > 0 && taskDetails[0].recipientgroup.length > 0) {
                                    const recipientgroup = taskDetails[0].recipientgroup;
                                    let showTxt = "";
                                    for (let i = 0; i < recipientgroup.length; i++) {
                                        showTxt += `${recipientgroup[i].rg_name}${i == recipientgroup.length - 1 ? "" : "、"}`;
                                    }

                                    let basicRowTxt = task.length == 2 ? 15 : 30;
                                    if (showTxt.length > basicRowTxt) {
                                        let lenShowTxtRow = showTxt.length % basicRowTxt;
                                        if (lenShowTxtRow != 0) {
                                            lenShowTxtRow = Math.ceil(showTxt.length / basicRowTxt);
                                        }
                                        else {
                                            lenShowTxtRow = showTxt.length / basicRowTxt;
                                        }

                                        let arr = [];
                                        [...new Array(lenShowTxtRow)].map((data, index) => {
                                            let newTxt = showTxt.slice(index * basicRowTxt, index * basicRowTxt + basicRowTxt);
                                            arr.push(<Text style={[styles.fColorBlack]} key={index}>{index == 0 ? "收件人清單： " : ""} {newTxt}</Text>);
                                        })
                                        return arr;
                                    }
                                    else {
                                        return (<Text style={[styles.fColorBlack, styles.marginBottom4]}>收件人清單： {showTxt}</Text>);
                                    }
                                }
                            })()}
                        </View>
                        {
                            task.length == 2 ?
                                <View style={styles.col}>
                                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                                        {
                                            Array.from(taskDetails[1].ftc_mailtitle).map((char) => <Text style={[styles.fWBold, styles.marginBottom4]}>{char}</Text>)
                                        }
                                    </View>

                                    <Text style={[styles.fColorBlack, styles.marginBottom4]}>開始時間： {taskDetails[1].ftc_startingtime}</Text>
                                    <Text style={[styles.fColorBlack, styles.marginBottom4]}>結束時間： {taskDetails[1].ftc_endingtime}</Text>
                                    <Text style={[styles.fColorBlack, styles.marginBottom4]}>任務期間： {taskDetails[1].days} days</Text>
                                    {(() => {
                                        if (task.length > 0 && taskDetails && taskDetails.length > 0 && taskDetails[0].recipientgroup.length > 0) {
                                            const recipientgroup = taskDetails[0].recipientgroup;
                                            let showTxt = "";
                                            for (let i = 0; i < recipientgroup.length; i++) {
                                                showTxt += `${recipientgroup[i].rg_name}${i == recipientgroup.length - 1 ? "" : "、"}`;
                                            }
                                            if (showTxt.length > 15) {
                                                let lenShowTxtRow = showTxt.length % 15;
                                                if (lenShowTxtRow != 0) {
                                                    lenShowTxtRow = Math.ceil(showTxt.length / 15);
                                                }
                                                else {
                                                    lenShowTxtRow = showTxt.length / 15;
                                                }

                                                let arr = [];
                                                [...new Array(lenShowTxtRow)].map((data, index) => {
                                                    let newTxt = showTxt.slice(index * 15, index * 15 + 15);
                                                    arr.push(<Text key={index} style={styles.fColorBlack}>{index == 0 ? "收件人清單： " : ""} {newTxt}</Text>);
                                                })
                                                return arr;
                                            }
                                            else {
                                                return (<Text style={styles.fColorBlack}>{showTxt}</Text>);
                                            }
                                        }
                                    })()}
                                </View> : ""
                        }

                        <View style={styles.col}>
                            <Text style={[styles.fWBold, styles.marginBottom4]}>寄信狀態</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>傳送比率： {sendMailDetail.send_per}%</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>回應比率： {sendMailDetail.onfish_per}%</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>已傳送郵件： {sendMailDetail.mail_success}</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>傳送失敗的收件人： {sendMailDetail.mail_fail}%</Text>
                            <Text style={[styles.fColorBlack, styles.marginBottom4]}>已取消的郵件： {sendMailDetail.mail_cancel}%</Text>
                        </View>
                    </View>
                    <View style={[styles.row, styles.fontSize10, styles.marginBottom8]}>
                        <View style={[styles.w50, styles.cardBlue]}>
                            <Text style={styles.fcNormal}>使用者行為</Text>
                            <View style={[styles.row]}>
                                <View style={[styles.w55]}>
                                    <Image src={finishedBehaviorImg ? finishedBehaviorImg.toBase64Image() : ""}></Image>
                                </View>
                                <View style={[styles.w45]}>
                                    <Text>共 {behaviorChartData.sendCount ? behaviorChartData.sendCount.toString() : 0} 位收件人</Text>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorA]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>僅打開電子郵件： <Text style={styles.textRight}>{behaviorChartData ? behaviorChartData.openemailCount : 0}次</Text></Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorB]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>點擊連結： <Text style={styles.textRight}>{behaviorChartData ? behaviorChartData.clicklinkCount : 0}次</Text></Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorC]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>輸入資料： <Text style={styles.textRight}>{behaviorChartData ? behaviorChartData.enterdataCount : 0}次</Text></Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorD]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>打開附件： <Text style={styles.textRight}>{behaviorChartData ? behaviorChartData.openadjunctCount : 0}次</Text></Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorE]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>無反應： <Text style={styles.textRight}>{behaviorChartData ? behaviorChartData.notouchCount : 0}次</Text></Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row, styles.textSmall]}>
                                        <Text>*次數重複計算</Text>
                                    </View>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}></View>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.w50, styles.cardBlue, styles.marginLeft8]}>
                            <Text style={styles.fcNormal}>使用者裝置</Text>
                            <View style={[styles.row]}>
                                <View style={[styles.w65]}>
                                    <View style={[styles.row]}></View>
                                    <Image src={finishedBrowerImg ? finishedBrowerImg.toBase64Image() : ""}></Image>
                                    <View style={[styles.row]}></View>
                                </View>
                                <View style={[styles.w35, styles.fontSize8]}>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}></View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorB]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>點擊連結 1 次 (<Text style={styles.textRight}>{browerChartData ? browerChartData.linkone : 0}</Text>)</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorA]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>輸入資料 1 次 (<Text style={styles.textRight}>{browerChartData ? browerChartData.enterone : 0}</Text>)</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorD]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>點擊連結 1 次以上 (<Text style={styles.textRight}>{browerChartData ? browerChartData.linkmany : 0}</Text>)</Text>
                                        </View>
                                    </View>
                                    <View style={[styles.row]}>
                                        <View style={[styles.w10]}>
                                            <View style={[styles.colorC]}></View>
                                        </View>
                                        <View style={[styles.w90]}>
                                            <Text>輸入資料 1 次以上 (<Text style={styles.textRight}>{browerChartData ? browerChartData.entermany : 0}</Text>)</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                    {(() => {
                        if (emptyArray) {
                            let arr = [];
                            arr.push(
                                <View style={[styles.row, styles.marginBottom8]}>
                                    <View style={[styles.col]}>
                                        <View style={[styles.fontSize10, styles.marginBottom8, styles.zIndex1]}>
                                            <View style={[styles.bgWhite, styles.padding10]}>
                                                <Text style={styles.fzC}>{emptyArray[0].title}</Text>
                                                <Image src={emptyArray[0].img}></Image>
                                            </View>
                                        </View>
                                    </View>
                                </View >
                            );
                            return arr;
                        }
                    })()}
                    {(() => {
                        if (waterMark.way == 2) {
                            return (<Text style={[styles.waterMarkText, styles.fWBold2]} fixed>{waterMark.word}</Text>);
                        }
                        else if (waterMark.way == 1) {
                            return (<Image style={[styles.waterMarkImage]} src={`${waterMark.photoSrc}`} fixed></Image>);
                        }
                        else {
                            return "";
                        }
                    })()}
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                    <View style={[styles.row, styles.marginBottom8]}>
                    </View>
                </Page>
                {(() => {
                    if (emptyArray.length > 1) {
                        let arr = [];
                        for (let ind = 1; ind < emptyArray.length; ind += 2) {
                            if (emptyArray.length - ind == 1) {
                                arr.push(
                                    <Page size="A4" style={styles.page} wrap={true}>
                                        <View style={[styles.fontSize10, styles.marginBottom8, styles.zIndex1]}>
                                            <View style={[styles.bgWhite, styles.padding10]}>
                                                <Text style={styles.fzC}>{emptyArray[ind].title}</Text>
                                                <Image src={emptyArray[ind].img}></Image>
                                            </View>
                                        </View>
                                        {(() => {
                                            if (waterMark.way == 2) {
                                                return (<Text style={[styles.waterMarkText, styles.fWBold2]} fixed>{waterMark.word}</Text>);
                                            }
                                            else if (waterMark.way == 1) {
                                                return (<Image style={[styles.waterMarkImage]} src={`${waterMark.photoSrc}`} fixed></Image>);
                                            }
                                            else {
                                                return "";
                                            }
                                        })()}
                                    </Page>
                                );
                            } else {
                                arr.push(
                                    <Page size="A4" style={styles.page} wrap={true}>
                                        <View style={[styles.fontSize10, styles.marginBottom8, styles.zIndex1]}>
                                            <View style={[styles.bgWhite, styles.padding10]}>
                                                <Text style={styles.fzC}>{emptyArray[ind].title}</Text>
                                                <Image src={emptyArray[ind].img}></Image>
                                            </View>
                                        </View>
                                        <View style={[styles.fontSize10, styles.marginBottom8, styles.zIndex1]}>
                                            <View style={[styles.bgWhite, styles.padding10]}>
                                                <Text style={styles.fzC}>{emptyArray[ind + 1].title}</Text>
                                                <Image src={emptyArray[ind + 1].img}></Image>
                                            </View>
                                        </View>
                                        {(() => {
                                            if (waterMark.way == 2) {
                                                return (<Text style={[styles.waterMarkText, styles.fWBold2]} fixed>{waterMark.word}</Text>);
                                            }
                                            else if (waterMark.way == 1) {
                                                return (<Image style={[styles.waterMarkImage]} src={`${waterMark.photoSrc}`} fixed></Image>);
                                            }
                                            else {
                                                return "";
                                            }
                                        })()}
                                    </Page>
                                );
                            }
                        }
                        return arr;
                    }
                })()}
                {
                    finishedDetailResponseTable ?
                        finishedDetailResponseTable.map((respond, respondIndex) => {
                            return (
                                <>
                                    <Page size="A4" style={styles.page} wrap={true}>
                                        {
                                            respond.type == 1 ?
                                                <View style={[styles.fontSize8, styles.marginBottom8, styles.zIndex1]}>
                                                    <Text style={styles.fzABold}>回應詳情</Text>
                                                </View> : ""
                                        }
                                        <Text style={styles.fontSize12}>{(() => {
                                            switch (respond.type) {
                                                case 1:
                                                    return t("ReportManage.inputData") //輸入資料
                                                case 2:
                                                    return t("ReportManage.clickLink") //點擊連結
                                                case 3:
                                                    return t("ReportManage.openAppendix") //偵測打開信件
                                                case 4:
                                                    return t("ReportManage.clickAppendix") //點擊附件
                                                default:
                                                    return null
                                            }
                                        })()}：{respond.detail.length} 筆</Text>
                                        <View style={[styles.table, styles.zIndex1]}>
                                            {
                                                task.length == 2 ?
                                                    <View style={[styles.tableHeader, styles.tableCell5]}><Text>任務名稱</Text></View> : ""
                                            }
                                            {
                                                socialInfo && socialInfo.fu_service == 2 ?
                                                    <View style={[styles.tableHeader, styles.tableCell4]}><Text>名字</Text></View> :
                                                    <View style={[styles.tableHeader, styles.tableCell5]}><Text>名字</Text></View>
                                            }
                                            {
                                                socialInfo && socialInfo.fu_service == 2 ?
                                                    <View style={[styles.tableHeader, styles.tableCell3]}><Text>公司</Text></View> : ""
                                            }
                                            <View style={[styles.tableHeader, styles.tableCell3]}><Text>{socialInfo && socialInfo.fu_service == 2 ? "部門" : "部門1"}</Text></View>
                                            {
                                                socialInfo && socialInfo.fu_service == 2 ?
                                                    <View style={[styles.tableHeader, styles.tableCell3]}><Text>部門2</Text></View> : ""
                                            }
                                            <View style={[styles.tableHeader, styles.tableCell3]}><Text>填寫次數</Text></View>
                                            <View style={[styles.tableHeader, styles.tableCell3]}><Text>裝置</Text></View>
                                            <View style={[styles.tableHeader, styles.tableCell4]}><Text>IP 位置</Text></View>
                                            <View style={[styles.tableHeader, styles.tableCell4]}><Text>時間</Text></View>
                                        </View>
                                        {
                                            respond.detail.map((detail, detailIndex) => {
                                                return (
                                                    <View style={[styles.tableRow]}>
                                                        {
                                                            task.length == 2 ?
                                                                <View style={[{ flexDirection: "row", flexWrap: "wrap" }, styles.tableCell5]}>
                                                                    {
                                                                        Array.from(detail.ftc_mailtitle).map((char) => <Text>{char}</Text>)
                                                                    }
                                                                </View> : ""
                                                        }
                                                        {
                                                            socialInfo && socialInfo.fu_service == 2 ?
                                                                <View style={[{ flexDirection: "row", flexWrap: "wrap" }, styles.tableCell4]}>
                                                                    {
                                                                        Array.from(detail.name).map((char) => <Text>{char}</Text>)
                                                                    }
                                                                </View> :
                                                                <View style={[{ flexDirection: "row", flexWrap: "wrap" }, styles.tableCell5]}>
                                                                    {
                                                                        Array.from(detail.name).map((char) => <Text>{char}</Text>)
                                                                    }
                                                                </View>
                                                        }
                                                        {
                                                            socialInfo && socialInfo.fu_service == 2 ?
                                                                <View style={[styles.tableCell3, { flexDirection: "row", flexWrap: "wrap" }]}>
                                                                    {
                                                                        Array.from(detail.company).map((char) => <Text>{char}</Text>)
                                                                    }
                                                                </View> : ""
                                                        }
                                                        <View style={[styles.tableCell3, { flexDirection: "row", flexWrap: "wrap" }]}>
                                                            {
                                                                Array.from(detail.department).map((char) => <Text>{char}</Text>)
                                                            }
                                                        </View>
                                                        {
                                                            socialInfo && socialInfo.fu_service == 2 ?
                                                                <View style={[styles.tableCell3, { flexDirection: "row", flexWrap: "wrap" }]}>
                                                                    {
                                                                        Array.from(detail.department2).map((char) => <Text>{char}</Text>)
                                                                    }
                                                                </View> : ""
                                                        }
                                                        <View style={[styles.tableCell3, styles.textAlignCenter]}><Text>{detail.actiondetail ? detail.actiondetail.length : 0}</Text></View>
                                                        <View style={[styles.tableCell3]}><Text>{detail.actiondetail ? detail.actiondetail[0].browser : ""}</Text></View>
                                                        <View style={[styles.tableCell4]}><Text>{detail.actiondetail ? detail.actiondetail[0].ipaddress : ""}</Text></View>
                                                        <View style={[styles.tableCell4]}><Text>{detail.actiondetail ? detail.actiondetail[0].createdtime : ""}</Text></View>
                                                    </View>
                                                )
                                            })
                                        }
                                        {(() => {
                                            if (waterMark.way == 2) {
                                                return (<Text style={[styles.waterMarkText, styles.fWBold2]} fixed>{waterMark.word}</Text>);
                                            }
                                            else if (waterMark.way == 1) {
                                                return (<Image style={[styles.waterMarkImage]} src={`${waterMark.photoSrc}`} fixed></Image>);
                                            }
                                            else {
                                                return "";
                                            }
                                        })()}
                                    </Page>
                                </>
                            )
                        }) : ""
                }
            </Document>
        ).toBlob();

        if (downloadSetChk.reportPaw) {
            const formData = new FormData();
            formData.append('Paw', downloadSetChk.paw);

            var file = new File([blob], "Test.pdf", { type: 'application/pdf' });
            formData.append('Pdffile', file);

            const result = await ApiSetPdfpawFunc(formData);

            if (result != "") {
                await ApiDownloadPDFFunc(result, `檔案_SE${moment(new Date()).format("yyyy_MM_DD_HH_mm")}.pdf`);
            }

            document.querySelector(".popup-loading").classList.remove('active');
        }
        else {
            downloadFile(blob, `檔案_SE${moment(new Date()).format("yyyy_MM_DD_HH_mm")}.pdf`);

            document.querySelector(".popup-loading").classList.remove('active');

        }
    }
    //
    //useEffect(() => {
    //    const fetchData = async () => {

    //        if (behaviorChartRef != null) {


    //            //// Register Font
    //            //Font.register({
    //            //    family: "MicrosoftBlack",
    //            //    src: MicrosoftBlack
    //            //});

    //            //// Create style with font-family
    //            //const styles = StyleSheet.create({
    //            //    page: {
    //            //        fontFamily: "MicrosoftBlack",
    //            //        margin: 0,
    //            //        backgroundColor: "#F7F9FD"
    //            //    },
    //            //});

    //            //const blob = await pdf(
    //            //    <Document>
    //            //        <Page size="A4" style={styles.page} wrap={true}>
    //            //            <Text>測試測試測試測試測試測試測試測試測試測試測試測試測試測試測試 測試測試 測試測試測試測試測試AA</Text>
    //            //            <Text>測試測試測試測試測試測試測試</Text>
    //            //            <image>{behaviorChartRef}</image>
    //            //        </Page>
    //            //    </Document>
    //            //).toBlob();

    //            //console.log(blob);

    //            //downloadFile(blob, `檔案_SE${moment(new Date()).format("yyyy_MM_DD_HH_mm")}.pdf`);
    //        }

    //        //const formData = new FormData();
    //        //formData.append('ids', task);
    //        //formData.append('pdffile', blob);
    //        //const result = await ApiUploadMyselfTemplatePhotoFunc(formData);

    //    };
    //    fetchData();
    //}, [behaviorChartRef]);

    //useEffect(() => {
    //    const fetchData = async () => {
    //        if (pdfHtml.current != null) {

    //        }

    //        //document.querySelector(".popup-loading").classList.add('active');

    //        //console.log(pdfHtml.querySelectorAll("#behaviorChart"));


    //        //const formData = new FormData();
    //        //formData.append('ids', task);
    //        //formData.append('pdffile', blob);
    //        //const result = await ApiUploadMyselfTemplatePhotoFunc(formData);

    //    };
    //    fetchData();
    //}, [behaviorChart]);

    const downloadFile = (blob, fileName) => {
        const link = document.createElement('a');
        // create a blobURI pointing to our Blob
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        // some browser needs the anchor to be in the doc
        document.body.append(link);
        link.click();
        link.remove();
        // in case the Blob uses a lot of memory
        setTimeout(() => URL.revokeObjectURL(link.href), 7000);
    };

    //#region 下載csvAPI
    const ApiDownloadCSVFunc = async (sendData) => {
        let downloadCSVResponse = await apiDownloadCSV(sendData);

        if (downloadCSVResponse && downloadCSVResponse.code == "0000") {
            const result = downloadCSVResponse.result;
            let apiData = [];
            if (socialInfo & socialInfo.fu_service == 2) {
                apiData.push({
                    "Task name": "",
                    "Frist Name": "",
                    "Last Name": "",
                    "Email": "",
                    "Company": "",
                    "Department-I": "",
                    "Department-II": "",
                    "Region": "",
                    "Send Time": "",
                    "Cancel": "",
                    "Action Time": "",
                    "Actions": "",
                    "Device": "",
                    "IP": ""
                });


                for (let i = 0; i < result.length; i++) {
                    apiData.push({
                        "Task name": result[i].taskname,
                        "Frist Name": result[i].fristname,
                        "Last Name": result[i].lastname,
                        "Email": result[i].email,
                        "Company": result[i].company,
                        "Department-I": result[i].department1,
                        "Department-II": result[i].department2,
                        "Region": result[i].region,
                        "Send Time": result[i].sendtime,
                        "Cancel": result[i].cancel,
                        "Action Time": result[i].actiontime,
                        "Actions": result[i].actions,
                        "Device": result[i].browser,
                        "IP": result[i].ipaddress
                    });
                }
            }
            else {
                apiData.push({
                    "Task name": "",
                    "Frist Name": "",
                    "Last Name": "",
                    "Email": "",
                    "Department": "",
                    "Region": "",
                    "Send Time": "",
                    "Cancel": "",
                    "Action Time": "",
                    "Actions": "",
                    "Device": ""
                });

                for (let i = 0; i < result.length; i++) {
                    apiData.push({
                        "Task name": result[i].taskname,
                        "Frist Name": result[i].fristname,
                        "Last Name": result[i].lastname,
                        "Email": result[i].email,
                        "Department": result[i].department1,
                        "Region": result[i].region,
                        "Send Time": result[i].sendtime,
                        "Cancel": result[i].cancel,
                        "Action Time": result[i].actiontime,
                        "Actions": result[i].actions,
                        "Device": result[i].browser
                    });
                }
            }

            const ws = XLSX.utils.json_to_sheet(apiData);
            const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
            const excelBuffer = XLSX.write(wb, { bookType: "csv", type: "array" });
            const data = new Blob([excelBuffer], { type: "text/csv" });
            FileSaver.saveAs(data, `檔案_SE${moment(new Date()).format("yyyy_MM_DD_HH_mm")}.csv`); //下載.csv
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: downloadCSVResponse.message,
                time: 1500
            });
        }
    }
    //#endregion

    //#region 下載csvAPI
    const ApiDownloadPDF = async (sendData) => {
        let downloadPDFResponse = await apiGenerateAndDownloadPDF(sendData);

        if (downloadPDFResponse && downloadPDFResponse.code == "0000") {
            const result = downloadPDFResponse.result;

            console.log(result);
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: downloadPDFResponse.message,
                time: 1500
            });
        }
    }
    //#endregion


    //#region 設定pdf密碼API
    const ApiSetPdfpawFunc = async (sendData) => {
        let result = ""; //下載PDF的GUID
        let setPdfpawResponse = await apiSetPdfpaw(sendData);

        if (setPdfpawResponse && setPdfpawResponse.code == "0000") {
            result = setPdfpawResponse.result;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: setPdfpawResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    //#region 將網址PDF檔案轉換成物件化並下載API
    const ApiDownloadPDFFunc = async (url, fileName) => {
        let downloadPDFResponse = await apiDownloadPDF(url + "?" + new Date().toISOString(), fileName);

        return downloadPDFResponse;
    }
    //#endregion

    //#region 任務(您最多只能選擇 2 個任務)錯誤訊息 關閉
    const handleResetAlert = async () => {
        setTaskListErr(0);
    }
    //#endregion

    return (
        loading ?
            <>
                <div className="content">
                    <div className="container-inside">
                        <div className="title-area">
                            <h1 className="fz-A">
                                {t("ReportManage.title")} {/*演練報告*/}
                            </h1>
                        </div>
                        <div className="main-area">
                            <div className="page-fnbar">
                                <div className="form-container">
                                    <div className="title">{t("ReportManage.chooseTask")} {/*選擇任務*/}</div>
                                    <div className={`form-item no-field flex-3 ${currentDropdown == "taskStatus" ? "clicked" : ""}`}>
                                        <div className="value">
                                            <div className={`dropdown-checkbox ${currentDropdown == "taskStatus" ? "active" : ""}`}
                                                onClick={(e) => handleDropdown(e, "taskStatus")}
                                                onBlur={(e) => handleBlurArea(e, "dropdown")}
                                                tabIndex="0">
                                                <div className="trigger">
                                                    <div>
                                                        <span>{dropdownCheckedTxt.taskStatus}</span>
                                                        <span></span>
                                                    </div>
                                                    <i className="icon icon-24"></i>
                                                </div>
                                                <div className="dropdown">
                                                    <div className="item">
                                                        <input type="checkbox" id="taskStatus0" value="0"
                                                            onChange={(e) => handleDropdownChecked(e, "taskStatus", 0)}
                                                            checked={dropdownChecked.taskStatus[0]}
                                                        />
                                                        <label htmlFor="taskStatus0">{t("ReportManage.taskStatus1")} {/*全部*/}</label>
                                                    </div>
                                                    <div className="item">
                                                        <input type="checkbox" id="taskStatus1" value="1"
                                                            onChange={(e) => handleDropdownChecked(e, "taskStatus", 1)}
                                                            checked={dropdownChecked.taskStatus[1]}
                                                        />
                                                        <label htmlFor="taskStatus1">{t("ReportManage.taskStatus2")}{/*進行中*/}</label>
                                                    </div>
                                                    <div className="item">
                                                        <input type="checkbox" id="taskStatus2" value="2"
                                                            onChange={(e) => handleDropdownChecked(e, "taskStatus", 2)}
                                                            checked={dropdownChecked.taskStatus[2]}
                                                        />
                                                        <label htmlFor="taskStatus2">{t("ReportManage.taskStatus3")}{/*已完成*/}</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`form-item no-field flex-5 ${currentDropdown == "task" ? "clicked" : ""}`}>
                                        <div className="value">
                                            <div className={`dropdown-checkbox ${currentDropdown == "task" ? "active" : ""} nowrap`}
                                                onClick={(e) => handleDropdown(e, "task")}
                                                onBlur={(e) => handleBlurArea(e, "dropdown")}
                                                tabIndex="0"
                                            >
                                                <div className="trigger">
                                                    <div>
                                                        <span data-field="" >{dropdownCheckedTxt.task}</span>
                                                        <span data-count=""></span>
                                                    </div>
                                                    <i className="icon icon-24"></i>
                                                </div>
                                                <div className="dropdown nowrap ">
                                                    {dropdownChecked.task.length > 0 ?
                                                        dropdownChecked.task.map((task, taskIndex) => {
                                                            //{ console.log(needDisable) }
                                                            //{ console.log(task.checked) }
                                                            return (
                                                                <div className={`item ${task.ftc_id == taskListErr ? "show-alert" : ""}`} key={taskIndex} >
                                                                    <input
                                                                        type="checkbox"
                                                                        id={`task_${taskIndex}`}
                                                                        value={task.ftc_id}
                                                                        onChange={(e) => handleDropdownChecked(e, "task", taskIndex)}
                                                                        checked={task.checked} disabled={(needDisable && !task.checked)}
                                                                        style={{ pointerEvents: (needDisable && !task.checked) ? "none" : "auto" }}
                                                                    />
                                                                    <label htmlFor={`task_${taskIndex}`}>{task.ftc_mailtitle}</label>
                                                                    <div className="alert-text" style={{ pointerEvents: "auto" }}>{t("ReportManage.chooseTaskLimit2")}<i className="icon icon-44 white" style={{ cursor: "pointer" }} onClick={() => handleResetAlert()}></i></div>
                                                                </div>
                                                            )
                                                        }) :
                                                        <div className="item no-data">
                                                            <i className="icon icon-71"></i>
                                                            <span className="fz-md">{t("ReportManage.notAlreadyTask")} {/*尚未有已發佈的任務*/}</span>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="btn-group">
                                    <button className={`btn ${task.length == 0 ? "disabled" : ""}`} href="" disabled={task.length == 0} onClick={(e) => shareReport(e)}>
                                        <span>{t("ReportManage.shareReport")} {/*分享報告*/}</span>
                                    </button>
                                    <button className={`btn ${task.length == 0 ? "disabled" : ""}`} href="" disabled={task.length == 0} onClick={(e) => downloadReport(e)}>
                                        <span>{t("ReportManage.downloadReport")} {/*下載報告*/}</span>
                                    </button>
                                    <button className={`btn`} href="" onClick={TestFunction}>
                                        <span>測試用</span>
                                    </button>
                                    {
                                        socialInfo && socialInfo.fu_service != 0 ?
                                            <button className="btn btn-text clear-width" onClick={(e) => setReportWatermark(e)}>
                                                <span>{t("ReportManage.setWatermark")} {/*設定浮水印*/}</span>
                                            </button> : ""
                                    }
                                </div>
                            </div>
                            <div className="tab-nav">
                                <a href="#" className={`${chooseTab == 1 ? "active" : ""}`} onClick={(e) => clickTab(e, 1)}>
                                    <span>{t("ReportManage.taskChart")} {/*任務圖表*/}</span>
                                </a>
                                <a href="#" className={`${chooseTab == 2 ? "active" : ""}`} onClick={(e) => clickTab(e, 2)}>
                                    <span>{t("ReportManage.taskDetail")}{/*任務詳情*/}</span>
                                </a>
                            </div>

                            <div className="tab-content">
                                {chooseTab == 1 ?
                                    <ReportChart
                                        dropdownChecked={dropdownChecked}
                                        setParentDropdownCheckedChart={setParentDropdownCheckedChart}
                                        setParentChoiceIpList={setParentChoiceIpList}
                                    /> :
                                    <ReportDetail
                                        dropdownChecked={dropdownChecked}
                                        setDropdownChecked={setDropdownChecked}
                                        dropdownCheckedTxt={dropdownCheckedTxt}
                                        setDropdownCheckedTxt={setDropdownCheckedTxt}
                                    />}
                            </div>
                        </div>
                    </div>
                    <Footer />

                    {
                        runPDF && task.length > 0 ?
                            <>
                                <DownloadBehaviorChart runPDF={runPDF} task={task}
                                    setFinishedBehaviorChart={setFinishedBehaviorChart}
                                    setFinishedBehaviorImg={setFinishedBehaviorImg}
                                    setBehaviorChartData={setBehaviorChartData}
                                    parentDropdownCheckedChart={parentDropdownCheckedChart}
                                    parentChoiceIpList={parentChoiceIpList}
                                />
                                <DownloadBrowerChart runPDF={runPDF} task={task}
                                    setFinishedBrowerChart={setFinishedBrowerChart}
                                    setFinishedBrowerImg={setFinishedBrowerImg}
                                    setBrowerChartData={setBrowerChartData}
                                />
                                <DownloadDaysAndBehaviorChart
                                    runPDF={runPDF}
                                    task={task[0]}
                                    setFinishedDaysBehaviorChart={setFinishedDaysBehaviorChart1}
                                    setFinishedDaysBehaviorImg={setFinishedDaysBehaviorImg1} objeee={1}
                                    parentDropdownCheckedChart={parentDropdownCheckedChart}
                                    parentChoiceIpList={parentChoiceIpList}
                                />
                                {
                                    task.length == 2 ?
                                        <DownloadDaysAndBehaviorChart runPDF={runPDF} task={task[1]}
                                            setFinishedDaysBehaviorChart={setFinishedDaysBehaviorChart2}
                                            setFinishedDaysBehaviorImg={setFinishedDaysBehaviorImg2} objeee={2}
                                        /> : ""
                                }
                                <DownloadSectorResponseChart runPDF={runPDF} task={task} myTask={myTask}
                                    setFinishedSectorResponseChart={setFinishedSectorResponseChart}
                                    setFinishedSectorResponseImg={setFinishedSectorResponseImg}
                                    parentDropdownCheckedChart={parentDropdownCheckedChart}
                                />
                                <DownloadDomainResponseChart runPDF={runPDF} task={task}
                                    setFinishedDomainResponseChart={setFinishedDomainResponseChart}
                                    setFinishedDomainResponseImg={setFinishedDomainResponseImg}
                                    parentDropdownCheckedChart={parentDropdownCheckedChart}
                                />
                                <DownloadDetailResponseChart runPDF={runPDF} task={task}
                                    setFinishedDetailResponse={setFinishedDetailResponse}
                                    setFinishedDetailResponseTable={setFinishedDetailResponseTable}
                                />
                            </> : ""
                    }
                </div>

                <Toast toastObj={toastObj} />

                {/*分享報告 modal - start*/}
                <div id="modal-a3-1" className={`modal ${modalStatus == "shareReport" ? "active layer-1" : ""}`}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="fz-C">{t("ReportManage.shareReport")} {/*分享報告*/}</h3>
                            <span className="close" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}>
                                <i className="icon icon-44"></i>
                            </span>
                        </div>
                        <div className="modal-body">
                            <form action="" className="form-container indent">
                                <div className="form-item no-field">
                                    <div className="value multi-inline">
                                        <div className="item flex-1">
                                            <input type="text" value={`${window.location.origin}/ShareReport/Chart/${shareReportGuid}`} disabled="disabled" autoComplete="off" />
                                        </div>
                                        <div className="item flex-auto">
                                            <div className={`btn-multisquare ${copyTextShareReportURLClass}`}>
                                                <div>
                                                    <button className="btn btn-icon dark" onClick={(e) => copyText(e, `${window.location.origin}/ShareReport/Chart/${shareReportGuid}`, "url")}>
                                                        <i className="icon icon-19"></i>
                                                    </button>
                                                </div>
                                                <div>
                                                    <div className="symbol blue">
                                                        <i className="icon icon-43"></i>
                                                        <span>{t("toast.copy")}{/*複製成功*/}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/*<button className="btn btn-icon dark" onClick={(e) => copyText(e, `${window.location.origin}/ShareReport/Chart/${shareReportGuid}`, "url")}>*/}
                                            {/*    <i className="icon icon-19"></i>*/}
                                            {/*</button>*/}
                                        </div>
                                    </div>
                                </div>
                                <div className="form-item no-field">
                                    <div className="value multi-inline">
                                        <div className="item">
                                            <input type="checkbox" id="setReportPaw" name="setReportPaw" checked={chkReportPaw}
                                                onChange={(e) => { setChkReportPaw(!chkReportPaw); }}
                                            />
                                            <label htmlFor="setReportPaw">{t("ReportManage.setReportPaw")} {/*設定報告密碼*/}</label>
                                        </div>
                                    </div>
                                </div>

                                <div className={`form-item hide-a311 ${reportPawErr ? "error" : ""}`} id="tog01" style={{ display: chkReportPaw ? "block" : "none" }}>
                                    <div className="field inline">
                                        {Parser(t("ReportManage.reportPawRemark"))}
                                        {/*請輸入報告專屬密碼，<span className="help-word-inline">為 6~ 10 個數字或英文字母</span>*/}
                                    </div>
                                    <div className="value multi-inline">
                                        <div className="item flex-1">
                                            <input type="text" value={reportPaw}
                                                maxLength="10"
                                                onChange={(e) => cheekPaw(e, 'change', "shareReport")}
                                                onBlur={(e) => cheekPaw(e, 'blur', "shareReport")} autoComplete="off"
                                                placeholder={t("ReportManage.enterReportPaw")}
                                            />
                                        </div>
                                        <div className="item flex-auto">
                                            <div className={`btn-multisquare ${copyTextShareReportClass}`}>
                                                <div>
                                                    <button className="btn btn-icon dark" onClick={(e) => copyText(e, reportPaw, "shareReport")}>
                                                        <i className="icon icon-19"></i>
                                                    </button>
                                                </div>
                                                <div>
                                                    <div className="symbol blue">
                                                        <i className="icon icon-43"></i>
                                                        <span>{t("toast.copy")}{/*複製成功*/}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {/*<button className="btn btn-icon dark" onClick={(e) => copyText(e, reportPaw)}>*/}
                                            {/*    <i className="icon icon-19"></i>*/}
                                            {/*</button>*/}
                                        </div>
                                    </div>
                                    <div className="fn">
                                        <button className="btn btn-text clear-width" onClick={(e) => generateRandomChars(e, "shareReport")}>
                                            <span>{t("ReportManage.autoProducePaw")} {/*自動產生密碼*/}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="btn-holder" style={{ display: chkReportPaw ? "block" : "none" }}>
                                <button className="btn btn-border" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}> <span>{t("ReportManage.cancel")} {/*取消*/}</span></button>
                                <button className="btn" onClick={(e) => saveReportPaw(e)}> <span>{t("ReportManage.saveSet")} {/*儲存設定*/}</span></button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-close" data-close=""></div>
                </div>
                {/*分享報告 modal - end*/}

                {/*設定報告浮水印 modal - start*/}
                <div id="modal-a3-10" className={`modal large ${modalStatus == "setReportWatermark" ? "active layer-1" : ""}`}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="fz-C">{t("ReportManage.setReportWatermark")} {/*設定報告浮水印*/}</h3>
                            <span className="close" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}>
                                <i className="icon icon-44"></i>
                            </span>
                        </div>
                        <div className="modal-body">
                            <div className="print-setting">
                                <div className="left">
                                    <form className="form-container">
                                        <div className="form-item no-field">
                                            <div className="value">
                                                <div className="item">
                                                    <input type="radio" id="notUseWatermark" name="watermarkKind"
                                                        onChange={(e) => handleChange(e, "notUseWatermark", "watermark")}
                                                        checked={waterMark.way == 0}
                                                    />
                                                    <label htmlFor="notUseWatermark">{t("ReportManage.notUseWatermark")} {/*不使用浮水印*/}</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-item no-field">
                                            <div className="value">
                                                <div className="item">
                                                    <input type="radio" id="imageWatermark" name="watermarkKind"
                                                        onChange={(e) => handleChange(e, "imageWatermark", "watermark")}
                                                        checked={waterMark.way == 1}
                                                    />
                                                    <label htmlFor="imageWatermark">{t("ReportManage.imageWatermark")} {/*圖片浮水印*/}</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-item-group indent">
                                            <div className={`form-item free-field ${waterMark.way != 1 ? "disabled" : ""}`}>
                                                <div className="field">
                                                    <button className={`btn btn-text clear-width ${waterMark.way != 1 ? "disabled" : ""}`}
                                                        onClick={(e) => clickModal(e, "cropImg")}
                                                    >
                                                        <span>{t("ReportManage.uploadImage")}{/*上傳圖片*/}</span>
                                                    </button>
                                                </div>
                                                <div className="value">
                                                    <div className="range">
                                                        <span>{t("ReportManage.transparency")} {/*透明度*/}</span>
                                                        <input type="range" id="transparency" name="transparency" min="0" max="100" step="10"
                                                            onChange={(e) => handleChange(e, "", "watermark")} disabled={waterMark.way != 1} value={waterMark.transparent}
                                                            style={{ background: `linear-gradient(to right, rgb(120, 168, 255) 0%, rgb(120, 168, 255) ${waterMark.transparent}%, rgb(188, 204, 220) ${waterMark.transparent}%, rgb(188, 204, 220) 100%)` }} />
                                                        <label htmlFor="transparency"></label>
                                                        <span></span>
                                                        <span> <strong>{waterMark.transparent}</strong>%</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-item col">
                                            <div className="value">
                                                <div className="item">
                                                    <input type="radio" id="textWatermark" name="watermarkKind"
                                                        onChange={(e) => handleChange(e, "textWatermark", "watermark")}
                                                        checked={waterMark.way == 2}
                                                    />
                                                    <label htmlFor="textWatermark">{t("ReportManage.textWatermark")} {/*文字浮水印*/}</label>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-item-group indent">
                                            <div className={`form-item free-field ${waterMark.way != 2 ? "disabled" : ""} ${waterMarkWord ? "error show-help" : ""}`}>
                                                <div className="field">{t("ReportManage.text")} {/*文字*/}</div>
                                                <div className="value">
                                                    <input type="text"
                                                        value={waterMark.word}
                                                        name="word"
                                                        onChange={(e) => handleChange(e, "", "watermark")}
                                                        disabled={waterMark.way != 2} autoComplete="off"
                                                        onBlur={(e) => waterMark.way == 2 && waterMark.word == "" || waterMark.word == null ? setWaterMarkWord(true) : setWaterMarkWord(false)}
                                                    />
                                                </div>
                                                <div className="help-word">
                                                    <i className="icon icon-28 inline"></i>{t("helpWord.required")} {/*不得空白*/}
                                                </div>
                                            </div>
                                            <div className={`form-item free-field ${waterMark.way != 2 ? "disabled" : ""}`}>
                                                <div className="field">{t("ReportManage.size")} {/*大小*/}</div>
                                                <div className="value">
                                                    <div className="range">
                                                        <input type="range" id="size" name="size" min="1" max="2" step="0.1" value={waterMark.size}
                                                            onChange={(e) => handleChange(e, "size", "watermark")} disabled={waterMark.way != 2}
                                                            style={{ background: `linear-gradient(to right, rgb(120, 168, 255) 0%, rgb(120, 168, 255) ${(waterMark.size - 1) * 100}%, rgb(188, 204, 220) ${(waterMark.size - 1) * 100}%, rgb(188, 204, 220) 100%)` }} />
                                                        <label htmlFor="size"></label>
                                                        <span> <strong>2</strong>{t("ReportManage.times")} {/*倍*/}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`form-item free-field ${waterMark.way != 2 ? "disabled" : ""}`}>
                                                <div className="field">{t("ReportManage.layout")} {/*版面*/}</div>
                                                <div className="value multi-inline">
                                                    <div className="item">
                                                        <input type="radio" id="diagonal" name="layout" disabled={waterMark.way != 2}
                                                            onChange={(e) => handleChange(e, "diagonal", "watermark")}
                                                            checked={waterMark.layout == 1}
                                                        />
                                                        <label htmlFor="diagonal">{t("ReportManage.diagonal")} {/*對角線*/}</label>
                                                    </div>
                                                    <div className="item">
                                                        <input type="radio" id="level" name="layout" disabled={waterMark.way != 2}
                                                            onChange={(e) => handleChange(e, "level", "watermark")}
                                                            checked={waterMark.layout == 2}
                                                        />
                                                        <label htmlFor="level">{t("ReportManage.level")} {/*水平*/}</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                                <div className="right">
                                    <div className="preview">
                                        <div className={`watermark text ${waterMark.way == 2 ? "active" : ""}`}
                                            style={{ transform: `scale(${waterMark.size}) rotate(${waterMark.layout == 1 ? 45 : 0}deg)` }}
                                        >
                                            <span>{waterMark.word}</span>
                                        </div>
                                        <div className={`watermark image ${waterMark.way == 1 ? "active" : ""}`} style={{ opacity: 1 - (waterMark.transparent / 100) }}>
                                            <div style={{ backgroundImage: `url('${waterMark.photoSrc}')` }} ></div>
                                        </div>
                                        <div className="base" style={{ backgroundImage: "url('/images/fake/preview-pdf.jpg')" }} ></div>
                                    </div>
                                </div>
                            </div>
                            <div className="btn-holder jcsb">
                                <div className="left">
                                </div>
                                <div className="right">
                                    <button className="btn btn-border" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}>
                                        <span>{t("ReportManage.cancel")} {/*取消*/}</span>
                                    </button>
                                    <button className="btn" onClick={(e) => clickModalComfire(e, "setWaterMark")}> <span>{t("ReportManage.confirm")}{/*確定*/}</span></button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-close" data-close=""></div>
                </div>
                {/*設定報告浮水印 modal - end*/}

                {/*照片上傳 modal - start*/}
                <div className="popup popup-crop">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h2 className="fz-A">選擇封面</h2>
                            <div className="btn-close" onClick={(e) => clickModalComfire(e, "cropImgCancel")}></div>
                        </div>
                        <div className="popup-body">
                            <div className="drop-area">
                                <div className="watermark">
                                    <img src="/images/layout/upload.svg" alt="" />
                                    <p>拖曳您的照片到這 <br />
                                        或點擊圖標進行上傳
                                    </p>
                                </div>
                                <input type="file" accept="image/png, image/jpeg" id="fileUploader"
                                    onChange={(e) => handleSelectBannerFile(e)}
                                />
                            </div>
                            <div className={saveCover.cropBox} id="cropbox" ref={ref}>
                                {
                                    saveCover.photoSrc != null ?
                                        <Cropper
                                            style={{ height: divHeight, width: "100%" }}
                                            zoomTo={0.5}
                                            preview=".img-preview"
                                            src={saveCover.photoSrc}
                                            viewMode={1}
                                            background={true}
                                            responsive={true}
                                            autoCropArea={1} //定義裁切區域大小
                                            onInitialized={(instance) => {
                                                setDivHeight(ref.current.clientHeight);
                                                setCropper(instance);
                                            }}
                                            guides={false} //顯示裁切框虛線
                                        /> : ""
                                }

                            </div>
                        </div>
                        <div className="popup-footer">
                            <div className="btn-area">
                                <button className="btn" onClick={(e) => clickModalComfire(e, "cropImgResult")}>
                                    <span>確定</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {/*照片上傳 modal - end*/}

                {/*下載報告 modal - start*/}
                <div id="modal-a3-3" className={`modal ${modalStatus == "downloadReport" ? "active layer-1" : ""}`}>
                    <div className="modal-container">
                        <div className="modal-header">
                            <h3 className="fz-C">{t("ReportManage.downloadReport")} {/*下載報告*/}</h3>
                            <span className="close" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}>
                                <i className="icon icon-44"></i>
                            </span>
                        </div>
                        <div className="modal-body">
                            <form action="" className="form-container indent">
                                <div className="form-item col">
                                    <div className="value">
                                        <div className="item">
                                            <input type="checkbox" id="downloadCSV" name="downloadCSV"
                                                onChange={(e) => handleChange(e)}
                                                checked={downloadSetChk.downloadCSV}
                                            />
                                            <label htmlFor="downloadCSV">下載 CSV</label>
                                        </div>
                                        <div className="item">
                                            <input type="checkbox" id="downloadPDF" name="downloadPDF"
                                                onChange={(e) => handleChange(e)}
                                                checked={downloadSetChk.downloadPDF}
                                                disabled={socialInfo && socialInfo.fu_service == 0}
                                            />
                                            <label htmlFor="downloadPDF">{t("ReportManage.downloadPDF")} {/*下載 PDF 報告*/}
                                                {(() => {
                                                    let showTxt = "";
                                                    if (socialInfo) {
                                                        switch (socialInfo.fu_service) {
                                                            case 0:
                                                                showTxt = t("ReportManage.downloadPDF0"); //(升級為 Standard 以上即享有此功能)
                                                                break;
                                                            case 2:
                                                                showTxt = t("ReportManage.downloadPDF2"); //(企業版)
                                                                break;
                                                            default:
                                                                showTxt = "";
                                                                break;
                                                        }

                                                        return showTxt;
                                                    }
                                                })()}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-item col indent">
                                    <div className="item">
                                        <input type="checkbox" id="reportPaw" name="reportPaw"
                                            onChange={(e) => handleChange(e)}
                                            checked={downloadSetChk.reportPaw}
                                            disabled={reportPawDisabled}
                                        />
                                        <label htmlFor="reportPaw">{t("ReportManage.setReportPaw")} {/*設定報告密碼*/}</label>
                                    </div>
                                </div>
                                <div className={`form-item hide-a311 indent ${downloadSetChkErr ? "error" : ""}`} id="tog03" style={{ display: `${downloadSetChk.reportPaw ? "block" : "none"}` }} >
                                    <div className="field inline">
                                        {Parser(t("ReportManage.reportPawRemark"))}
                                        {/*請輸入報告專屬密碼，<span className="help-word-inline">為 6~ 10 個數字或英文字母</span>*/}
                                    </div>
                                    <div className="value multi-inline">
                                        <div className="item flex-1">
                                            <input type="text"
                                                value={downloadSetChk.paw}
                                                maxLength="10"
                                                onChange={(e) => cheekPaw(e, 'change', "downloadReport")}
                                                onBlur={(e) => cheekPaw(e, 'blur', "downloadReport")} autoComplete="off"
                                                placeholder={t("ReportManage.enterReportPaw")}
                                            />
                                        </div>
                                        <div className="item flex-auto">
                                            <div className={`btn-multisquare ${copyTextDownloadReportClass}`}>
                                                <div>
                                                    <button className="btn btn-icon dark" onClick={(e) => copyText(e, downloadSetChk.paw, "downloadReport")}>
                                                        <i className="icon icon-19"></i>
                                                    </button>
                                                </div>
                                                <div>
                                                    <div className="symbol blue">
                                                        <i className="icon icon-43"></i>
                                                        <span>{t("toast.copy")}{/*複製成功*/}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="fn">
                                        <button className="btn btn-text clear-width" onClick={(e) => generateRandomChars(e, "downloadReport")}>
                                            <span>{t("ReportManage.autoProducePaw")} {/*自動產生密碼*/}</span>
                                        </button>
                                    </div>
                                </div>
                            </form>
                            <div className="btn-holder">
                                <button className="btn btn-border" onClick={(e) => { e.preventDefault(); setModalStatus(""); }}> <span>{t("ReportManage.cancel")} {/*取消*/}</span></button>
                                <button className={`btn ${downloadBtn ? "disabled" : ""}`} onClick={(e) => { downloadReportConfirm(e); }} disabled={downloadBtn ? true : false}> <span>{t("ReportManage.download")} {/*下載*/}</span></button>
                            </div>
                        </div>
                    </div>
                    <div className="modal-close" data-close=""></div>
                </div>
                {/*下載報告 modal - end*/}


            </>
            : <></>
    );
}

export default ReportManage;

//#region 下載使用者行為Component
const DownloadBehaviorChart = (props) => {
    const { runPDF, task, setFinishedBehaviorChart, setFinishedBehaviorImg, setBehaviorChartData, parentDropdownCheckedChart, parentChoiceIpList } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const behaviorChartRef = useRef(null);
    const [useDoughnut, setUseDoughnut] = useState(false);
    const [behaviorChart, setBehaviorChart] = useState({
        sendCount: 0, //任務收件人數
        behaviorCount: 0, //行為次數
        openemailCount: 0, //僅打開電子郵件次數
        clicklinkCount: 0, //點擊連結次數
        enterdataCount: 0, //輸入資訊次數
        openadjunctCount: 0, //打開附件次數
        notouchCount: 0, //無反應次數
        openemailCountPercentage: 0, //僅打開電子郵件次數百分比
        clicklinkCountPercentage: 0, //點擊連結次數百分比
        enterdataCountPercentage: 0, //輸入資訊次數百分比
        openadjunctCountPercentage: 0, //打開附件次數百分比
        notouchCountPercentage: 0, //無反應次數百分比
    }); //任務圖表行為統計
    const [apiFinish, setApiFinish] = useState(false);
    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                let company = [];
                let department = [];
                let department2 = [];

                if (parentDropdownCheckedChart) {
                    //公司
                    let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                    let stratIndex = 0;
                    if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterCompany.length; i++) {
                        company.push(filterCompany[i].name);
                    }

                    let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                    let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                    stratIndex = 0;
                    if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment.length; i++) {
                        department.push(filterDepartment[i].name);
                    }
                    stratIndex = 0;
                    if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment2.length; i++) {
                        department2.push(filterDepartment2[i].name);
                    }
                }

                let sendData = {
                    ids: task,
                    company: company,
                    department: department,
                    department2: department2,
                    ipaddress: parentChoiceIpList,
                };

                let result = await ApiGetTaskActionChartFunc(sendData);
                if (result) {
                    //setFinishedBehaviorImg(behaviorChartRef.current);
                    //setFinishedBehaviorChart(true);
                    setApiFinish(true)
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得任務圖表行為統計(ids)API
    const ApiGetTaskActionChartFunc = async (sendData) => {
        let result = false;
        let getTaskActionChartResponse = await apiGetTaskActionChart(sendData);
        //console.log("取得任務圖表行為統計(ids)", getTaskActionChartResponse);

        if (getTaskActionChartResponse && getTaskActionChartResponse.code == "0000") {
            let newBehaviorChart = { ...behaviorChart };
            newBehaviorChart.sendCount = getTaskActionChartResponse.result.sendcount;
            newBehaviorChart.openemailCount = getTaskActionChartResponse.result.openemailcount;
            newBehaviorChart.clicklinkCount = getTaskActionChartResponse.result.clicklinkcount;
            newBehaviorChart.enterdataCount = getTaskActionChartResponse.result.enterdatacount;
            newBehaviorChart.openadjunctCount = getTaskActionChartResponse.result.openadjunctcount;
            newBehaviorChart.notouchCount = getTaskActionChartResponse.result.notouchcount;

            let total = getTaskActionChartResponse.result.openemailcount +
                getTaskActionChartResponse.result.clicklinkcount +
                getTaskActionChartResponse.result.enterdatacount +
                getTaskActionChartResponse.result.openadjunctcount +
                getTaskActionChartResponse.result.notouchcount;
            if (total > 0) {
                setUseDoughnut(true)
            } else {
                setUseDoughnut(false)
            }
            newBehaviorChart.behaviorCount = total;
            newBehaviorChart.openemailCountPercentage = Math.round((newBehaviorChart.openemailCount / total) * 100);
            newBehaviorChart.clicklinkCountPercentage = Math.round((newBehaviorChart.clicklinkCount / total) * 100);
            newBehaviorChart.enterdataCountPercentage = Math.round((newBehaviorChart.enterdataCount / total) * 100);
            newBehaviorChart.openadjunctCountPercentage = Math.round((newBehaviorChart.openadjunctCount / total) * 100);
            newBehaviorChart.notouchCountPercentage = Math.round((newBehaviorChart.notouchCount / total) * 100);
            setBehaviorChart(newBehaviorChart);
            setBehaviorChartData(newBehaviorChart);
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getTaskActionChartResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion


    return (
        <>
            <DoughnutChart
                setFinishedBehaviorImg={setFinishedBehaviorImg}
                setFinishedBehaviorChart={setFinishedBehaviorChart}
                behaviorChart={behaviorChart}
                apiFinish={apiFinish}>
            </DoughnutChart>
            <Toast toastObj={toastObj} />
        </>
    );
}
//#endregion

const DoughnutChart = (props) => {
    const { setFinishedBehaviorImg, behaviorChart, setFinishedBehaviorChart, apiFinish } = props;
    const [have, setHave] = useState(false);
    const behaviorChartRef = useRef(null);
    useEffect(() => {
        const fetchData = async () => {
            if (apiFinish) {
                setHave(true)
            }
        };
        fetchData();
    }, [apiFinish]);


    var myInterval = window.setInterval((() => {
        if (behaviorChartRef) {
            setFinishedBehaviorImg(behaviorChartRef.current);
            setFinishedBehaviorChart(true);
            clearInterval(myInterval);
        } else {
            clearInterval(myInterval);
        }
    }
    ), 300);


    //useEffect(() => {
    //    if (behaviorChartRef) {
    //        setFinishedBehaviorImg(behaviorChartRef.current);
    //        setFinishedBehaviorChart(true);
    //    }
    //}, [behaviorChartRef])

    const plugins = [{
        afterDraw: function (chart, args, options) {
            let newBehaviorChart = { ...behaviorChart };
            var width = chart.width,
                height = chart.height,
                ctx = chart.ctx;
            ctx.restore();
            var fontSize = (height / 160).toFixed(2);

            ctx.textBaseline = "middle";
            var text = newBehaviorChart.behaviorCount + "\n個行為";

            var lineheight = 76;
            var lines = text.split('\n');
            for (var i = 0; i < lines.length; i++) {
                if (i == 0) {
                    ctx.font = "bolder 76px Arial";
                } else {
                    ctx.font = "60px Arial";
                }
                var textX = Math.round((width - ctx.measureText(lines[i]).width) / 2);
                var textY = Math.round((height - 76) / 2);
                ctx.fillStyle = "#ffffff";

                ctx.fillText(lines[i], textX, textY + (i * lineheight));
            }
            ctx.save();
        }
    }, ChartDataLabels]

    return (
        <>
            {
                have ?
                    <Doughnut
                        ref={behaviorChartRef} style={{ display: 'none' }}
                        data={{
                            labels: ['僅打開電子郵件', '點擊連結', '輸入資料', '打開附件', '無反應'],
                            datasets: [
                                {
                                    data: [behaviorChart.openemailCountPercentage, behaviorChart.clicklinkCountPercentage,
                                    behaviorChart.enterdataCountPercentage, behaviorChart.openadjunctCountPercentage,
                                    behaviorChart.notouchCountPercentage],
                                    backgroundColor: [
                                        '#78A8FF',
                                        '#FFC700',
                                        '#38D7E7',
                                        '#FF6F3D',
                                        '#AFD7F1'
                                    ],
                                    borderWidth: 0
                                },
                            ],
                        }}
                        options={{
                            aspectRatio: 1,
                            plugins: {
                                datalabels: {
                                    color: '#fff',
                                    font: {
                                        size: 40
                                    },
                                    display: true,
                                    formatter: function (value, ctx) {
                                        if (value == 0) {
                                            return '';
                                        } else {
                                            return value + '%';
                                        }
                                    },
                                },
                                legend: {
                                    display: false,
                                    align: 'start',
                                    position: 'bottom',
                                },
                                tooltip: {
                                    callbacks: {
                                        title: function (tooltipItem, data) {
                                            return "";
                                        },
                                        label: function (context) {
                                            let num = 0;
                                            switch (context.label) {
                                                case '僅打開電子郵件':
                                                    num = behaviorChart.openemailCount;
                                                    break;
                                                case '點擊連結':
                                                    num = behaviorChart.clicklinkCount;
                                                    break;
                                                case '輸入資料':
                                                    num = behaviorChart.enterdataCount;
                                                    break;
                                                case '打開附件':
                                                    num = behaviorChart.openadjunctCount;
                                                    break;
                                                case '無反應':
                                                    num = behaviorChart.notouchCount;
                                                    break;
                                                case '':
                                                    num = 0;
                                                    break;
                                            }
                                            return `${String(context.label)}\n\r${num}次`;
                                        }
                                    }
                                }
                            }
                        }}
                        plugins={plugins}
                    />
                    : ""
            }
        </>
    );
}


//#region 下載瀏覽器類型Component
const DownloadBrowerChart = (props) => {
    const { runPDF, task, setFinishedBrowerChart, setFinishedBrowerImg, setBrowerChartData, parentDropdownCheckedChart, parentChoiceIpList } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const browerChartRef = useRef(null);
    const [brower, setBrower] = useState(null); //任務圖表瀏覽器統計
    const [browerCount, setBrowerCount] = useState({
        linkone: 0,
        enterone: 0,
        linkmany: 0,
        entermany: 0
    }); //任務圖表瀏覽器統計

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                let company = [];
                let department = [];
                let department2 = [];

                if (parentDropdownCheckedChart) {
                    //公司
                    let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                    let stratIndex = 0;
                    if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterCompany.length; i++) {
                        company.push(filterCompany[i].name);
                    }

                    let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                    let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                    stratIndex = 0;
                    if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment.length; i++) {
                        department.push(filterDepartment[i].name);
                    }
                    stratIndex = 0;
                    if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment2.length; i++) {
                        department2.push(filterDepartment2[i].name);
                    }
                }

                let sendData = {
                    ids: task,
                    company: company,
                    department: department,
                    department2: department2,
                    ipaddress: parentChoiceIpList
                };

                let result = await ApiGetBrowserTypeFunc(sendData);

                if (result) {
                    setFinishedBrowerImg(browerChartRef.current);
                    setFinishedBrowerChart(true);
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得瀏覽器類型統計(ids)API
    const ApiGetBrowserTypeFunc = async (sendData) => {
        let result = false;
        let getBrowserTypeResponse = await apiGetBrowserType(sendData);
        //console.log("取得瀏覽器類型統計(ids)", getBrowserTypeResponse);

        if (getBrowserTypeResponse && getBrowserTypeResponse.code == "0000") {
            setBrower(getBrowserTypeResponse.result);

            let linkone = 0;
            let enterone = 0;
            let linkmany = 0;
            let entermany = 0;
            for (let i = 0; i < getBrowserTypeResponse.result.length; i++) {
                linkone += getBrowserTypeResponse.result[i].linkone;
                enterone += getBrowserTypeResponse.result[i].enterone;
                linkmany += getBrowserTypeResponse.result[i].linkmany;
                entermany += getBrowserTypeResponse.result[i].entermany;
            }
            let newBrowerCount = { ...browerCount };
            newBrowerCount.linkone = linkone;
            newBrowerCount.enterone = enterone;
            newBrowerCount.linkmany = linkmany;
            newBrowerCount.entermany = entermany;
            setBrowerCount(newBrowerCount);
            setBrowerChartData(newBrowerCount);
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getBrowserTypeResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    return (
        <>
            <Bar ref={browerChartRef} style={{ display: 'none' }}
                options={{
                    animation: true,
                    responsive: true,
                    scales: {
                        x: {
                            stacked: true,
                            ticks: {
                                color: '#BCDEF4',
                                font: {
                                    size: 50
                                }
                            },
                            grid: {
                                color: '#5A8CC7',
                                borderColor: '#BCDEF4'
                            }
                        },
                        y: {
                            ticks: {
                                color: '#BCDEF4',
                                font: {
                                    size: 60
                                }
                            },
                            stacked: true,
                            grid: {
                                borderColor: '#BCDEF4'
                            }
                        },
                    },
                    plugins: {
                        datalabels: {
                            display: false,
                            datalabels: {
                                color: '#fff',
                                font: {
                                    size: 40
                                }
                            },
                        },
                        deferred: {
                            xOffset: 150,
                            yOffset: '50%',
                            delay: 200
                        },
                        legend: {
                            display: false,
                            position: 'right',
                            labels: {
                                color: '#fff',
                                font: {
                                    size: 50
                                }
                            },
                            align: 'start',
                            maxWidth: 300
                        },
                        title: {
                            display: false,
                            text: '2021 Supplier Overview',
                            font: {
                                size: 16,
                                weight: 'bold',
                            }
                        }
                    }
                }}
                data={{
                    labels: ['PC', 'Mobile', '其他'],
                    datasets: [{
                        label: `點擊連結 1 次 (${browerCount.linkone})`,
                        backgroundColor: "#FFC700",
                        data: [
                            brower ? brower[0].linkone : 0, brower ? brower[1].linkone : 0,
                            brower ? brower[2].linkone : 0
                        ],
                        borderWidth: 0,
                        barPercentage: 0.4,
                        maxBarThickness: 80,
                    }, {
                        label: `輸入資料 1 次 (${browerCount.enterone})`,
                        backgroundColor: "#78A8FF",
                        data: [
                            brower ? brower[0].enterone : 0, brower ? brower[1].enterone : 0,
                            brower ? brower[2].enterone : 0
                        ],
                        borderWidth: 0,
                        barPercentage: 0.4,
                        maxBarThickness: 80,
                    }, {
                        label: `點擊連結 1 次以上 (${browerCount.linkmany})`,
                        backgroundColor: "#FF6F3D",
                        data: [
                            brower ? brower[0].linkmany : 0, brower ? brower[1].linkmany : 0,
                            brower ? brower[2].linkmany : 0
                        ],
                        borderWidth: 0,
                        barPercentage: 0.4,
                        maxBarThickness: 80,
                    }, {
                        label: `輸入資料 1 次以上 (${browerCount.entermany})`,
                        backgroundColor: "#38D7E7",
                        data: [
                            brower ? brower[0].entermany : 0, brower ? brower[1].entermany : 0,
                            brower ? brower[2].entermany : 0
                        ],
                        borderWidth: 0,
                        barPercentage: 0.4,
                        maxBarThickness: 80,
                    }],
                    borderWidth: 0
                }}
            />
            <Toast toastObj={toastObj} />
        </>
    );
}
//#endregion

//#region 下載天數與行為Component
const DownloadDaysAndBehaviorChart = (props) => {
    const { runPDF, task, setFinishedDaysBehaviorChart, setFinishedDaysBehaviorImg, objeee, parentDropdownCheckedChart, parentChoiceIpList } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const daysBehaviorChartRef = useRef([]);
    const [daysBehaviorTask1XDatasEchartNum, setDaysBehaviorTask1XDatasEchartNum] = useState(0); //天數與行為任務1(需產生幾張圖表)
    const [daysBehaviorTask1XDatas, setDaysBehaviorTask1XDatas] = useState(null); //天數與行為任務1-XDatas
    const [daysBehaviorTask1ClickLink, setDaysBehaviorTask1ClickLink] = useState(null); //天數與行為任務1-點擊連結
    const [daysBehaviorTask1InputData, setDaysBehaviorTask1InputData] = useState(null); //天數與行為任務1-輸入資料
    const [daysBehaviorTask1OpenAppendix, setDaysBehaviorTask1OpenAppendix] = useState(null); //天數與行為任務1-打開附件
    const [daysBehaviorTask1OpenMail, setDaysBehaviorTask1OpenMail] = useState(null); //天數與行為任務1-僅打開電子郵件
    const [daysBehaviorTask1TClickLinkToolTip, setDaysBehaviorTask1ClickLinkToolTip] = useState(null); //天數與行為任務1-點擊連結ToolTip
    const [daysBehaviorTask1InputDataToolTip, setDaysBehaviorTask1InputDataToolTip] = useState(null); //天數與行為任務1-輸入資料ToolTip
    const [daysBehaviorTask1OpenAppendixToolTip, setDaysBehaviorTask1OpenAppendixToolTip] = useState(null); //天數與行為任務1-打開附件ToolTip

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                let company = [];
                let department = [];
                let department2 = [];

                if (parentDropdownCheckedChart) {
                    //公司
                    let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                    let stratIndex = 0;
                    if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterCompany.length; i++) {
                        company.push(filterCompany[i].name);
                    }

                    let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                    let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                    stratIndex = 0;
                    if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment.length; i++) {
                        department.push(filterDepartment[i].name);
                    }
                    stratIndex = 0;
                    if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment2.length; i++) {
                        department2.push(filterDepartment2[i].name);
                    }
                }

                let sendData = {
                    ids: [task],
                    types: 1,
                    company: company,
                    department: department,
                    department2: department2,
                    ipaddress: parentChoiceIpList
                };
                let result = await ApiGetActionChartFunc(sendData);

                if (result) {
                    //setFinishedDaysBehaviorImg(browerChartRef.current);
                    //console.log(browerChartRef);

                    setFinishedDaysBehaviorChart(true);
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得各圖表資料(ids)API
    const ApiGetActionChartFunc = async (sendData) => {
        let result = false;
        let getActionChartResponse = await apiGetActionChart(sendData);
        //console.log("取得各圖表資料(ids)", getActionChartResponse);

        if (getActionChartResponse && getActionChartResponse.code == "0000") {
            let response = getActionChartResponse.result;
            setDaysBehaviorTask1XDatasEchartNum(response[0].xdatas.length % 10 == 0 ? parseInt(response[0].xdatas.length / 10) : parseInt(response[0].xdatas.length / 10) + 1);
            setDaysBehaviorTask1XDatas(response[0].xdatas);
            setDaysBehaviorTask1ClickLink(response[0].clickLink);
            setDaysBehaviorTask1InputData(response[0].inputData);
            setDaysBehaviorTask1OpenAppendix(response[0].openAppendix);
            setDaysBehaviorTask1OpenMail(response[0].openMail);

            setDaysBehaviorTask1ClickLinkToolTip(response[0].clickLinktip);
            setDaysBehaviorTask1InputDataToolTip(response[0].inputDatatip);
            setDaysBehaviorTask1OpenAppendixToolTip(response[0].openAppendixtip);
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getActionChartResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    const loadRef = (index, total) => {
        //console.log(daysBehaviorChartRef.current[index]);

        if (index == total - 1 || total == null) {
            //console.log(objeee, browerChartRef.current);
            setFinishedDaysBehaviorImg(daysBehaviorChartRef.current);
        }
    }

    return (
        <>
            {
                [...new Array(daysBehaviorTask1XDatasEchartNum)].map((data, index) => {
                    let newXDatas = daysBehaviorTask1XDatas;
                    let sliceXDatas = newXDatas.slice(index * 10, (index + 1) * 10);

                    let newOpenMail = daysBehaviorTask1OpenMail;
                    let sliceOpenMail = newOpenMail.slice(index * 10, (index + 1) * 10);

                    let newClickLink = daysBehaviorTask1ClickLink;
                    let sliceClickLink = newClickLink.slice(index * 10, (index + 1) * 10);

                    let newInputData = daysBehaviorTask1InputData;
                    let sliceInputData = newInputData.slice(index * 10, (index + 1) * 10);

                    let newOpenAppendix = daysBehaviorTask1OpenAppendix;
                    let sliceOpenAppendix = newOpenAppendix.slice(index * 10, (index + 1) * 10);


                    return (<Bar key={index} ref={(el) => { daysBehaviorChartRef.current[index] = el; loadRef(index, daysBehaviorTask1XDatasEchartNum); }}
                        style={{ display: 'none' }}
                        options={{
                            bezierCurve: false,
                            animation: true,
                            responsive: true,
                            scales: {
                                x: {
                                    stacked: true,
                                    ticks: {
                                        font: {
                                            size: 23
                                        }
                                    }
                                },
                                y: {
                                    stacked: true,
                                    ticks: {
                                        font: {
                                            size: 25
                                        }
                                    }
                                }
                            },
                            plugins: {
                                datalabels: {
                                    display: false
                                },
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        font: {
                                            size: 25
                                        },
                                        usePointStyle: true
                                    },
                                }
                            }
                        }}
                        data={{
                            labels: sliceXDatas,
                            datasets: [{
                                label: '僅開啟電子信箱',
                                backgroundColor: "#4F94D4",
                                data: sliceOpenMail,
                                borderColor: '#4F94D4',
                                type: 'line'
                            }, {
                                label: '點擊連結',
                                backgroundColor: "#78A8FF",
                                data: sliceClickLink,
                                borderWidth: 0,
                                barPercentage: 0.4,
                                maxBarThickness: 40,
                                pointStyle: 'rect'
                            }, {
                                label: '輸入資料',
                                backgroundColor: "#38D7E7",
                                data: sliceInputData,
                                borderWidth: 0,
                                barPercentage: 0.4,
                                maxBarThickness: 40,
                                pointStyle: 'rect'
                            }, {
                                label: '打開附件',
                                backgroundColor: "#FF6F3D",
                                data: sliceOpenAppendix,
                                borderWidth: 0,
                                barPercentage: 0.4,
                                maxBarThickness: 40,
                                pointStyle: 'rect'
                            }]
                        }}
                    />
                    )
                })
            }
        </>
    );
}
//#endregion

//#region 部門反應Component
const DownloadSectorResponseChart = (props) => {
    const { runPDF, task, myTask, setFinishedSectorResponseChart, setFinishedSectorResponseImg, parentDropdownCheckedChart, parentChoiceIpList } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const sectorChartRef = useRef([]);
    const chartRef = useRef([]); //chart Ref
    const chartImageRef = useRef([]); //圖片imgae

    const [sectorResponseTaskXDatasEchartNum, setSectorResponseTaskXDatasEchartNum] = useState(0); //部門反應任務(需產生幾張圖表)
    const [sectorResponseTaskXDatas, setSectorResponseTaskXDatas] = useState(null); //部門反應任務1-XDatas
    const [sectorResponseTask1ClickLink, setSectorResponseTask1ClickLink] = useState(null); //部門反應任務1-點擊連結
    const [sectorResponseTask1InputData, setSectorResponseTask1InputData] = useState(null); //部門反應任務1-輸入資料
    const [sectorResponseTask1OpenAppendix, setSectorResponseTask1OpenAppendix] = useState(null); //部門反應任務1-打開附件
    const [sectorResponseTask1OpenMail, setSectorResponseTask1OpenMail] = useState(null); //部門反應任務1-僅打開電子郵件
    const [sectorResponseTask1TClickLinkToolTip, setSectorResponseTask1ClickLinkToolTip] = useState(null); //部門反應任務1-點擊連結ToolTip
    const [sectorResponseTask1InputDataToolTip, setSectorResponseTask1InputDataToolTip] = useState(null); //部門反應任務1-輸入資料ToolTip
    const [sectorResponseTask1OpenAppendixToolTip, setSectorResponseTask1OpenAppendixToolTip] = useState(null); //部門反應任務1-打開附件ToolTip

    const [sectorResponseTask2ClickLink, setSectorResponseTask2ClickLink] = useState(null); //部門反應任務2-點擊連結
    const [sectorResponseTask2InputData, setSectorResponseTask2InputData] = useState(null); //部門反應任務2-輸入資料
    const [sectorResponseTask2OpenAppendix, setSectorResponseTask2OpenAppendix] = useState(null); //部門反應任務2-打開附件
    const [sectorResponseTask2OpenMail, setSectorResponseTask2OpenMail] = useState(null); //部門反應任務2-僅打開電子郵件
    const [sectorResponseTask2TClickLinkToolTip, setSectorResponseTask2ClickLinkToolTip] = useState(null); //部門反應任務1-點擊連結ToolTip
    const [sectorResponseTask2InputDataToolTip, setSectorResponseTask2InputDataToolTip] = useState(null); //部門反應任務1-輸入資料ToolTip
    const [sectorResponseTask2OpenAppendixToolTip, setSectorResponseTask2OpenAppendixToolTip] = useState(null); //部門反應任務1-打開附件ToolTip

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                let company = [];
                let department = [];
                let department2 = [];

                if (parentDropdownCheckedChart) {
                    //公司
                    let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                    let stratIndex = 0;
                    if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterCompany.length; i++) {
                        company.push(filterCompany[i].name);
                    }

                    let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                    let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                    stratIndex = 0;
                    if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment.length; i++) {
                        department.push(filterDepartment[i].name);
                    }
                    stratIndex = 0;
                    if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment2.length; i++) {
                        department2.push(filterDepartment2[i].name);
                    }
                }


                let sendData = {
                    ids: task,
                    types: 2,
                    company: company,
                    department: department,
                    department2: department2,
                    ipaddress: parentChoiceIpList
                };
                let result = await ApiGetActionChartFunc(sendData);

                if (result) {
                    //setFinishedSectorResponseImg(sectorChartRef.current);
                    setFinishedSectorResponseChart(true);
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得各圖表資料(ids)API
    const ApiGetActionChartFunc = async (sendData) => {
        let result = false;
        let getActionChartResponse = await apiGetActionChart(sendData);
        //console.log("取得各圖表資料(ids)", getActionChartResponse);

        if (getActionChartResponse && getActionChartResponse.code == "0000") {
            let response = getActionChartResponse.result;
            if (task.length == 1) {
                let xdatasIndex = response[0].xdatas.findIndex(d => d == "");
                let xdatas = response[0].xdatas;
                if (xdatasIndex != -1) {
                    xdatas[xdatasIndex] = "無部門";
                }

                setSectorResponseTaskXDatasEchartNum(xdatas.length % 10 == 0 ? parseInt(xdatas.length / 10) : parseInt(xdatas.length / 10) + 1);
                setSectorResponseTaskXDatas(xdatas);
                setSectorResponseTask1ClickLink(response[0].clickLink);
                setSectorResponseTask1InputData(response[0].inputData);
                setSectorResponseTask1OpenAppendix(response[0].openAppendix);
                setSectorResponseTask1OpenMail(response[0].openMail);

                setSectorResponseTask1ClickLinkToolTip(response[0].clickLinktip);
                setSectorResponseTask1InputDataToolTip(response[0].inputDatatip);
                setSectorResponseTask1OpenAppendixToolTip(response[0].openAppendixtip);
            }
            else {
                let response1 = response[0];
                let response2 = response[1];
                let concatXdatas = [];
                let concatShowdata = [];
                for (let i = 0; i < 2; i++) {
                    let filterTask = response.find(d => d.ftc_id == task[i]);
                    concatXdatas = concatXdatas.concat(filterTask.xdatas);
                    concatShowdata = concatShowdata.concat(filterTask.showdata);
                }
                let newConcatXdatas = concatXdatas.filter((item, index) => concatXdatas.indexOf(item) === index).sort().reverse();
                let arryClickLinkTask1 = [];
                let arryClickLinkTask2 = [];
                let arryInputDataTask1 = [];
                let arryInputDataTask2 = [];
                let arryOpenAppendixTask1 = [];
                let arryOpenAppendixTask2 = [];
                let arryOpenMailTask1 = [];
                let arryOpenMailTask2 = [];

                let arryClickLinkToolTipTask1 = [];
                let arryClickLinkToolTipTask2 = [];
                let arryInputDataToolTipTask1 = [];
                let arryInputDataToolTipTask2 = [];
                let arryOpenAppendixToolTipTask1 = [];
                let arryOpenAppendixToolTipTask2 = [];

                for (let i = 0; i < newConcatXdatas.length; i++) {
                    let clickLinkFilter = concatShowdata.filter(d => d.action == 2 && d.xdata == newConcatXdatas[i]);
                    if (clickLinkFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryClickLinkTask1.push(response1.clickLink[xDataIndex]);
                            arryClickLinkTask2.push(0);
                            arryClickLinkToolTipTask1.push(`${response1.clickLink[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryClickLinkToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryClickLinkTask2.push(response2.clickLink[xDataIndex]);
                            arryClickLinkTask1.push(0);
                            arryClickLinkToolTipTask2.push(`${response2.clickLink[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryClickLinkToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryClickLinkTask1.push(response1.clickLink[xData1Index]);
                        arryClickLinkTask2.push(response2.clickLink[xData2Index]);

                        arryClickLinkToolTipTask1.push(`${response1.clickLink[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryClickLinkToolTipTask2.push(`${response2.clickLink[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let inputDataFilter = concatShowdata.filter(d => d.action == 1 && d.xdata == newConcatXdatas[i]);
                    if (inputDataFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryInputDataTask1.push(response1.inputData[xDataIndex]);
                            arryInputDataTask2.push(0);
                            arryInputDataToolTipTask1.push(`${response1.inputData[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryInputDataToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryInputDataTask2.push(response2.inputData[xDataIndex]);
                            arryInputDataTask1.push(0);
                            arryInputDataToolTipTask2.push(`${response2.inputData[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryInputDataToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryInputDataTask1.push(response1.inputData[xData1Index]);
                        arryInputDataTask2.push(response2.inputData[xData2Index]);

                        arryInputDataToolTipTask1.push(`${response1.inputData[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryInputDataToolTipTask2.push(`${response2.inputData[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let openAppendixFilter = concatShowdata.filter(d => d.action == 4 && d.xdata == newConcatXdatas[i]);
                    if (openAppendixFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenAppendixTask1.push(response1.openAppendix[xDataIndex]);
                            arryOpenAppendixTask2.push(0);
                            arryOpenAppendixToolTipTask1.push(`${response1.openAppendix[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryOpenAppendixToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenAppendixTask2.push(response2.openAppendix[xDataIndex]);
                            arryOpenAppendixTask1.push(0);
                            arryOpenAppendixToolTipTask2.push(`${response2.openAppendix[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryOpenAppendixToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryOpenAppendixTask1.push(response1.openAppendix[xData1Index]);
                        arryOpenAppendixTask2.push(response2.openAppendix[xData2Index]);

                        arryOpenAppendixToolTipTask1.push(`${response1.openAppendix[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryOpenAppendixToolTipTask2.push(`${response2.openAppendix[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let openMailFilter = concatShowdata.filter(d => d.action == 3 && d.xdata == newConcatXdatas[i]);
                    if (openMailFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenMailTask1.push(response1.openMail[xDataIndex]);
                            arryOpenMailTask2.push(0);
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenMailTask2.push(response2.openMail[xDataIndex]);
                            arryOpenMailTask1.push(0);
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryOpenMailTask1.push(response1.openMail[xData1Index]);
                        arryOpenMailTask2.push(response2.openMail[xData2Index]);
                    }
                }

                let xdatasIndex = newConcatXdatas.findIndex(d => d == "");
                let xdatas = newConcatXdatas;
                if (xdatasIndex != -1) {
                    xdatas[xdatasIndex] = "無部門";
                }

                setSectorResponseTaskXDatasEchartNum(xdatas.length % 10 == 0 ? parseInt(xdatas.length / 10) : parseInt(xdatas.length / 10) + 1);
                setSectorResponseTaskXDatas(xdatas);
                setSectorResponseTask1ClickLink(arryClickLinkTask1);
                setSectorResponseTask2ClickLink(arryClickLinkTask2);
                setSectorResponseTask1InputData(arryInputDataTask1);
                setSectorResponseTask2InputData(arryInputDataTask2);
                setSectorResponseTask1OpenAppendix(arryOpenAppendixTask1);
                setSectorResponseTask2OpenAppendix(arryOpenAppendixTask2);
                setSectorResponseTask1OpenMail(arryOpenMailTask1);
                setSectorResponseTask2OpenMail(arryOpenMailTask2);

                setSectorResponseTask1ClickLinkToolTip(arryClickLinkToolTipTask1);
                setSectorResponseTask2ClickLinkToolTip(arryClickLinkToolTipTask2);
                setSectorResponseTask1InputDataToolTip(arryInputDataToolTipTask1);
                setSectorResponseTask2InputDataToolTip(arryInputDataToolTipTask2);
                setSectorResponseTask1OpenAppendixToolTip(arryOpenAppendixToolTipTask1);
                setSectorResponseTask2OpenAppendixToolTip(arryOpenAppendixToolTipTask2);
            }
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getActionChartResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    const loadRef = (index, total) => {
        //console.log(sectorChartRef.current[index]);

        if (index == total - 1 || total == null) {
            //console.log(sectorChartRef.current);


            chartRef.current.map((currRef, currIndex) => {
                if (currRef && chartImageRef.current[currIndex]) {
                    chartImageRef.current[currIndex].src = currRef.toBase64Image();
                }
            })


            setFinishedSectorResponseImg(sectorChartRef.current);
            //setFinishedSectorResponseImg(chartRef.current);
        }
    }

    //#region 取得或生成[部門反應] legend 容器列表
    const getOrCreateLegendList = (chart, id, taskLength) => {
        const legendContainer = document.getElementById(id);
        let listContainer = legendContainer.querySelector("ul");

        if (!listContainer) {
            listContainer = document.createElement("ul");
            listContainer.style.display = "flex";
            listContainer.style.flexDirection = "row";
            listContainer.style.marginLeft = "auto";
            listContainer.style.marginRight = "auto";
            listContainer.style.marginTop = "10px";
            listContainer.style.marginBottom = "10px";
            listContainer.style.padding = "0";

            legendContainer.appendChild(listContainer);
        }
        else {
            if (taskLength > 1) {
                listContainer.style.width = "";
            }
            else {
                listContainer.style.width = "60%";
            }
        }

        return listContainer;
    };
    //#endregion

    //#region [部門反應] legend
    const htmlLegendPlugin = {
        id: "htmlLegend",
        afterUpdate(chart, args, options) {
            const ul = getOrCreateLegendList(chart, options.containerID, myTask.length);

            // Remove old legend items
            while (ul.firstChild) {
                ul.firstChild.remove();
            }

            // Reuse the built-in legendItems generator
            const items = chart.options.plugins.legend.labels.generateLabels(chart);

            const li = document.createElement("li");
            li.style.alignItems = "center";
            li.style.display = "flex";
            li.style.flexDirection = "row";
            li.style.marginLeft = "10px";
            li.style.marginRight = "20px";

            // Task name in the begining of legend
            const taskNameBox = document.createElement("div");
            taskNameBox.style.display = "flex";
            taskNameBox.style.flexDirection = "column";
            taskNameBox.setAttribute("id", options.containerID + "taskName");
            taskNameBox.setAttribute("class", "color-box");
            for (let i = 0; i < myTask.length; i++) {
                // Text
                const textContainer = document.createElement("p");
                textContainer.style.margin = "0";
                textContainer.style.padding = "0";
                textContainer.style.fontSize = "20px";
                textContainer.setAttribute("class", "ellipsis")
                const text = document.createTextNode(myTask[i].ftc_mailtitle);
                textContainer.appendChild(text);
                taskNameBox.appendChild(textContainer);
            }
            li.appendChild(taskNameBox);
            if (myTask.length > 1) { //2個在顯示
                ul.appendChild(li);
            }

            // generate the legend
            items.forEach((item, index) => {
                const li = document.createElement("li");
                li.style.display = "flex";
                li.style.alignItems = "center";
                if (index == 0) {
                    li.style.marginLeft = "75px";
                }
                else {
                    li.style.marginLeft = "10px";
                }
                getColorBox(ul, li, item)
            });
        }
    };
    //#endregion

    //#region 圖表的顏色色塊
    const getColorBox = (ul, li, item) => {
        var parentId = ul.parentNode.id;
        const colorBox = document.getElementById(parentId + "-" + item.text);

        if (!colorBox) {
            // if there is no exsit div with item text id, then create one and set the flex direction to column
            const colorBox = document.createElement("div");
            colorBox.style.display = "flex";
            colorBox.style.flexDirection = "column";
            colorBox.style.marginRight = "10px";
            colorBox.setAttribute("id", parentId + "-" + item.text);
            colorBox.setAttribute("class", "color-box task-name");

            // Color span-- to fill the legend color
            const boxSpan = document.createElement("span");
            boxSpan.style.background = item.fillStyle;
            boxSpan.style.borderColor = item.strokeStyle;
            boxSpan.style.width = "20px";
            boxSpan.style.height = "20px";
            boxSpan.style.borderWidth = String(item.lineWidth) + "px";
            boxSpan.setAttribute("class", "color-fill-box")

            if (item.text === "僅開啟電子信箱") {
                // in this case index 0 and 4 are line chart which need to show circle legend
                boxSpan.setAttribute("class", "color-fill-box rounded-color-box")
                boxSpan.style.width = "30px"
                boxSpan.style.height = "30px"
                boxSpan.style.borderRadius = "30px"
            }

            // Text - set the legend item text
            const textContainer = document.createElement("p");
            textContainer.style.color = item.fontColor;
            textContainer.style.fontSize = "25px";
            textContainer.style.margin = "0";
            textContainer.style.padding = "0";
            textContainer.style.textDecoration = item.hidden ? "line-through" : "";

            const text = document.createTextNode(item.text);
            textContainer.appendChild(text); // bind the text to text container

            // bind all DOM together
            colorBox.appendChild(boxSpan);
            li.appendChild(colorBox);
            li.appendChild(textContainer);
            ul.appendChild(li);
        } else {
            // if there is a same item text id div, which means we don't need the colorBox
            // jsut append the color span to selected color box

            // Color span
            if (item.fillStyle[0] == "#") {
                // if fillStyle is color, create the same color span
                const boxSpan = document.createElement("span");
                boxSpan.setAttribute("class", "color-fill-box")
                boxSpan.style.width = "20px";
                boxSpan.style.height = "20px";
                if (item.datasetIndex == 0 || item.datasetIndex == 4) {
                    boxSpan.setAttribute("class", "color-fill-box rounded-color-box")
                    boxSpan.style.width = "30px"
                    boxSpan.style.height = "30px"
                    boxSpan.style.borderRadius = "30px"
                }
                boxSpan.style.background = item.fillStyle;
                boxSpan.style.borderColor = item.strokeStyle;
                boxSpan.style.borderWidth = String(item.lineWidth) + "px";

                colorBox.appendChild(boxSpan)
            } else {
                // if fillStyle is not a color code, which means that is a custom pattern
                // need to create a canvas to draw the pattern
                const canvas = document.createElement("canvas");
                canvas.setAttribute("class", "color-fill-box")
                canvas.width = 20;
                canvas.height = 20;
                const ctx = canvas.getContext("2d");
                const pattern = item.fillStyle;
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, 20, 20);
                colorBox.appendChild(canvas)
            }
        }
        return colorBox;
    }
    //#endregion

    return (
        <>
            {
                [...new Array(sectorResponseTaskXDatasEchartNum)].map((data, index) => {
                    let newXDatas = sectorResponseTaskXDatas;
                    let sliceXDatas = newXDatas.slice(index * 10, (index + 1) * 10);

                    let newOpenMail1 = sectorResponseTask1OpenMail;
                    let sliceOpenMail1 = newOpenMail1.slice(index * 10, (index + 1) * 10);

                    let newClickLink1 = sectorResponseTask1ClickLink;
                    let sliceClickLink1 = newClickLink1.slice(index * 10, (index + 1) * 10);

                    let newInputData1 = sectorResponseTask1InputData;
                    let sliceInputData1 = newInputData1.slice(index * 10, (index + 1) * 10);

                    let newOpenAppendix1 = sectorResponseTask1OpenAppendix;
                    let sliceOpenAppendix1 = newOpenAppendix1.slice(index * 10, (index + 1) * 10);

                    let newOpenMail2 = sectorResponseTask2OpenMail;
                    let sliceOpenMail2 = task.length == 2 ? newOpenMail2.slice(index * 10, (index + 1) * 10) : [];

                    let newClickLink2 = sectorResponseTask2ClickLink;
                    let sliceClickLink2 = task.length == 2 ? newClickLink2.slice(index * 10, (index + 1) * 10) : [];

                    let newInputData2 = sectorResponseTask2InputData;
                    let sliceInputData2 = task.length == 2 ? newInputData2.slice(index * 10, (index + 1) * 10) : [];

                    let newOpenAppendix2 = sectorResponseTask2OpenAppendix;
                    let sliceOpenAppendix2 = task.length == 2 ? newOpenAppendix2.slice(index * 10, (index + 1) * 10) : [];

                    return (
                        <div
                            key={index}
                            ref={(el) => { sectorChartRef.current[index] = el; loadRef(index, sectorResponseTaskXDatasEchartNum); }}
                            style={{ fontSize: "25px" }}
                        >
                            <img ref={(el) => { chartImageRef.current[index] = el }}></img>
                            <Bar ref={(el) => { chartRef.current[index] = el }}
                                style={{ display: 'none' }}
                                data={
                                    task.length == 2 ?
                                        {
                                            labels: sliceXDatas,
                                            datasets: [
                                                {
                                                    label: '僅開啟電子信箱',
                                                    backgroundColor: "#4F94D4",
                                                    data: sliceOpenMail1,
                                                    borderColor: '#4F94D4',
                                                    type: 'line',
                                                    stack: 'lineStack0',
                                                },
                                                {
                                                    label: '點擊連結',
                                                    backgroundColor: "#78A8FF",
                                                    data: sliceClickLink1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '輸入資料',
                                                    backgroundColor: "#38D7E7",
                                                    data: sliceInputData1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '打開附件',
                                                    backgroundColor: "#FF6F3D",
                                                    data: sliceOpenAppendix1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '僅開啟電子信箱',
                                                    backgroundColor: "#FFFFFF",
                                                    borderColor: '#84C2E1',
                                                    data: sliceOpenMail2,
                                                    borderColor: '#38D7E7',
                                                    type: 'line',
                                                    stack: 'lineStack1',
                                                },
                                                {
                                                    label: '點擊連結',
                                                    backgroundColor: "#E6EEFF",
                                                    borderColor: "#78A8FF",
                                                    data: sliceClickLink2,
                                                    borderWidth: 2,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 1',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '輸入資料',
                                                    backgroundColor: "#E8FBFC",
                                                    borderColor: "#38D7E7",
                                                    data: sliceInputData2,
                                                    borderWidth: 2,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 1',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '打開附件',
                                                    backgroundColor: "#FFECE6",
                                                    borderColor: "#FF6F3D",
                                                    data: sliceOpenAppendix2,
                                                    borderWidth: 2,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 1',
                                                    pointStyle: 'rect'
                                                }
                                            ]
                                        } :
                                        {
                                            labels: sliceXDatas,
                                            datasets: [
                                                {
                                                    label: '僅開啟電子信箱',
                                                    backgroundColor: "#4F94D4",
                                                    data: sliceOpenMail1,
                                                    borderColor: '#4F94D4',
                                                    type: 'line'
                                                },
                                                {
                                                    label: '點擊連結',
                                                    backgroundColor: "#78A8FF",
                                                    data: sliceClickLink1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '輸入資料',
                                                    backgroundColor: "#38D7E7",
                                                    data: sliceInputData1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                },
                                                {
                                                    label: '打開附件',
                                                    backgroundColor: "#FF6F3D",
                                                    data: sliceOpenAppendix1,
                                                    borderWidth: 0,
                                                    barPercentage: 0.4,
                                                    maxBarThickness: 40,
                                                    stack: 'Stack 0',
                                                    pointStyle: 'rect'
                                                }
                                            ]
                                        }
                                }
                                options={{
                                    animation: true,
                                    responsive: true,
                                    scales: {
                                        x: {
                                            stacked: true,
                                            ticks: {
                                                font: {
                                                    size: 23
                                                }
                                            }
                                        },
                                        y: {
                                            stacked: true,
                                            ticks: {
                                                font: {
                                                    size: 25
                                                }
                                            }
                                        },
                                    },
                                    plugins: {
                                        datalabels: {
                                            display: false
                                        },
                                        deferred: {
                                            xOffset: 150,
                                            yOffset: '50%',
                                            delay: 200
                                        },
                                        htmlLegend: {
                                            containerID: `legend-container-${index}`,
                                        },
                                        legend: {
                                            display: false,
                                        },
                                        title: {
                                            display: false,
                                        }
                                    }
                                }}
                                plugins={[htmlLegendPlugin]}
                            />
                            <div id={`legend-container-${index}`} />
                        </div>)
                })
            }
        </>
    );
}
//#endregion

//#region 域名反應Component
const DownloadDomainResponseChart = (props) => {
    const { runPDF, task, setFinishedDomainResponseChart, setFinishedDomainResponseImg, parentDropdownCheckedChart, parentChoiceIpList } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const domainChartRef = useRef([]);

    const [domainResponseTaskXDatasEchartNum, setDomainResponseTaskXDatasEchartNum] = useState(null); //域名反應任務1-XDatas
    const [domainResponseTaskXDatas, setDomainResponseTaskXDatas] = useState(null); //域名反應任務1-XDatas
    const [domainResponseTask1ClickLink, setDomainResponseTask1ClickLink] = useState(null); //域名反應任務1-點擊連結
    const [domainResponseTask1InputData, setDomainResponseTask1InputData] = useState(null); //域名反應任務1-輸入資料
    const [domainResponseTask1OpenAppendix, setDomainResponseTask1OpenAppendix] = useState(null); //域名反應任務1-打開附件
    const [domainResponseTask1OpenMail, setDomainResponseTask1OpenMail] = useState(null); //域名反應任務1-僅打開電子郵件
    const [domainResponseTask1TClickLinkToolTip, setDomainResponseTask1ClickLinkToolTip] = useState(null); //域名反應任務1-點擊連結ToolTip
    const [domainResponseTask1InputDataToolTip, setDomainResponseTask1InputDataToolTip] = useState(null); //域名反應任務1-輸入資料ToolTip
    const [domainResponseTask1OpenAppendixToolTip, setDomainResponseTask1OpenAppendixToolTip] = useState(null); //域名反應任務1-打開附件ToolTip

    const [domainResponseTask2ClickLink, setDomainResponseTask2ClickLink] = useState(null); //域名反應任務2-點擊連結
    const [domainResponseTask2InputData, setDomainResponseTask2InputData] = useState(null); //域名反應任務2-輸入資料
    const [domainResponseTask2OpenAppendix, setDomainResponseTask2OpenAppendix] = useState(null); //域名反應任務2-打開附件
    const [domainResponseTask2OpenMail, setDomainResponseTask2OpenMail] = useState(null); //域名反應任務2-僅打開電子郵件
    const [domainResponseTask2TClickLinkToolTip, setDomainResponseTask2ClickLinkToolTip] = useState(null); //域名反應任務1-點擊連結ToolTip
    const [domainResponseTask2InputDataToolTip, setDomainResponseTask2InputDataToolTip] = useState(null); //域名反應任務1-輸入資料ToolTip
    const [domainResponseTask2OpenAppendixToolTip, setDomainResponseTask2OpenAppendixToolTip] = useState(null); //域名反應任務1-打開附件ToolTip

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                let company = [];
                let department = [];
                let department2 = [];

                if (parentDropdownCheckedChart) {
                    //公司
                    let filterCompany = parentDropdownCheckedChart.company.filter(d => d.checked == true);
                    let stratIndex = 0;
                    if (filterCompany.length == parentDropdownCheckedChart.company.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterCompany.length; i++) {
                        company.push(filterCompany[i].name);
                    }

                    let filterDepartment = parentDropdownCheckedChart.department.filter(d => d.checked == true);
                    let filterDepartment2 = parentDropdownCheckedChart.department2.filter(d => d.checked == true);
                    stratIndex = 0;
                    if (filterDepartment.length == parentDropdownCheckedChart.department.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment.length; i++) {
                        department.push(filterDepartment[i].name);
                    }
                    stratIndex = 0;
                    if (filterDepartment2.length == parentDropdownCheckedChart.department2.length) {
                        stratIndex = 1;
                    }
                    for (let i = stratIndex; i < filterDepartment2.length; i++) {
                        department2.push(filterDepartment2[i].name);
                    }
                }

                let sendData = {
                    ids: task,
                    types: 3,
                    company: company,
                    department: department,
                    department2: department2,
                    ipaddress: parentChoiceIpList
                };

                let result = await ApiGetActionChartFunc(sendData);

                if (result) {
                    setFinishedDomainResponseChart(true);
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得各圖表資料(ids)API
    const ApiGetActionChartFunc = async (sendData) => {
        let result = false;
        let getActionChartResponse = await apiGetActionChart(sendData);
        //console.log("取得各圖表資料(ids)", getActionChartResponse);

        if (getActionChartResponse && getActionChartResponse.code == "0000") {
            let response = getActionChartResponse.result;
            if (task.length == 1) {
                let xdatasIndex = response[0].xdatas.findIndex(d => d == "");
                let xdatas = response[0].xdatas;
                if (xdatasIndex != -1) {
                    xdatas[xdatasIndex] = "無部門";
                }

                setDomainResponseTaskXDatasEchartNum(xdatas.length % 10 == 0 ? parseInt(xdatas.length / 10) : parseInt(xdatas.length / 10) + 1);
                setDomainResponseTaskXDatas(xdatas);
                setDomainResponseTask1ClickLink(response[0].clickLink);
                setDomainResponseTask1InputData(response[0].inputData);
                setDomainResponseTask1OpenAppendix(response[0].openAppendix);
                setDomainResponseTask1OpenMail(response[0].openMail);

                setDomainResponseTask1ClickLinkToolTip(response[0].clickLinktip);
                setDomainResponseTask1InputDataToolTip(response[0].inputDatatip);
                setDomainResponseTask1OpenAppendixToolTip(response[0].openAppendixtip);
            }
            else {
                let response1 = response[0];
                let response2 = response[1];
                let concatXdatas = [];
                let concatShowdata = [];
                for (let i = 0; i < 2; i++) {
                    let filterTask = response.find(d => d.ftc_id == task[i]);
                    concatXdatas = concatXdatas.concat(filterTask.xdatas);
                    concatShowdata = concatShowdata.concat(filterTask.showdata);
                }
                let newConcatXdatas = concatXdatas.filter((item, index) => concatXdatas.indexOf(item) === index).sort().reverse();
                let arryClickLinkTask1 = [];
                let arryClickLinkTask2 = [];
                let arryInputDataTask1 = [];
                let arryInputDataTask2 = [];
                let arryOpenAppendixTask1 = [];
                let arryOpenAppendixTask2 = [];
                let arryOpenMailTask1 = [];
                let arryOpenMailTask2 = [];

                let arryClickLinkToolTipTask1 = [];
                let arryClickLinkToolTipTask2 = [];
                let arryInputDataToolTipTask1 = [];
                let arryInputDataToolTipTask2 = [];
                let arryOpenAppendixToolTipTask1 = [];
                let arryOpenAppendixToolTipTask2 = [];

                for (let i = 0; i < newConcatXdatas.length; i++) {
                    let clickLinkFilter = concatShowdata.filter(d => d.action == 2 && d.xdata == newConcatXdatas[i]);
                    if (clickLinkFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryClickLinkTask1.push(response1.clickLink[xDataIndex]);
                            arryClickLinkTask2.push(0);
                            arryClickLinkToolTipTask1.push(`${response1.clickLink[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryClickLinkToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryClickLinkTask2.push(response2.clickLink[xDataIndex]);
                            arryClickLinkTask1.push(0);
                            arryClickLinkToolTipTask2.push(`${response2.clickLink[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryClickLinkToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryClickLinkTask1.push(response1.clickLink[xData1Index]);
                        arryClickLinkTask2.push(response2.clickLink[xData2Index]);

                        arryClickLinkToolTipTask1.push(`${response1.clickLink[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryClickLinkToolTipTask2.push(`${response2.clickLink[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let inputDataFilter = concatShowdata.filter(d => d.action == 1 && d.xdata == newConcatXdatas[i]);
                    if (inputDataFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryInputDataTask1.push(response1.inputData[xDataIndex]);
                            arryInputDataTask2.push(0);
                            arryInputDataToolTipTask1.push(`${response1.inputData[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryInputDataToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryInputDataTask2.push(response2.inputData[xDataIndex]);
                            arryInputDataTask1.push(0);
                            arryInputDataToolTipTask2.push(`${response2.inputData[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryInputDataToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryInputDataTask1.push(response1.inputData[xData1Index]);
                        arryInputDataTask2.push(response2.inputData[xData2Index]);

                        arryInputDataToolTipTask1.push(`${response1.inputData[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryInputDataToolTipTask2.push(`${response2.inputData[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let openAppendixFilter = concatShowdata.filter(d => d.action == 4 && d.xdata == newConcatXdatas[i]);
                    if (openAppendixFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenAppendixTask1.push(response1.openAppendix[xDataIndex]);
                            arryOpenAppendixTask2.push(0);
                            arryOpenAppendixToolTipTask1.push(`${response1.openAppendix[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryOpenAppendixToolTipTask2.push('0人共0次');
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenAppendixTask2.push(response2.openAppendix[xDataIndex]);
                            arryOpenAppendixTask1.push(0);
                            arryOpenAppendixToolTipTask2.push(`${response2.openAppendix[xDataIndex]}人共${clickLinkFilter[0].times}次`);
                            arryOpenAppendixToolTipTask1.push('0人共0次');
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryOpenAppendixTask1.push(response1.openAppendix[xData1Index]);
                        arryOpenAppendixTask2.push(response2.openAppendix[xData2Index]);

                        arryOpenAppendixToolTipTask1.push(`${response1.openAppendix[xData1Index]}人共${clickLinkFilter[0].times}次`);
                        arryOpenAppendixToolTipTask2.push(`${response2.openAppendix[xData2Index]}人共${clickLinkFilter[1].times}次`);
                    }

                    let openMailFilter = concatShowdata.filter(d => d.action == 3 && d.xdata == newConcatXdatas[i]);
                    if (openMailFilter.length == 1) {
                        let ftcFilter = response1.xdatas.filter(d => d == newConcatXdatas[i]);
                        if (ftcFilter.length > 0) {
                            let xDataIndex = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenMailTask1.push(response1.openMail[xDataIndex]);
                            arryOpenMailTask2.push(0);
                        }
                        else {
                            let xDataIndex = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);
                            arryOpenMailTask2.push(response2.openMail[xDataIndex]);
                            arryOpenMailTask1.push(0);
                        }
                    }
                    else {
                        let xData1Index = response1.xdatas.findIndex(d => d == newConcatXdatas[i]);
                        let xData2Index = response2.xdatas.findIndex(d => d == newConcatXdatas[i]);

                        arryOpenMailTask1.push(response1.openMail[xData1Index]);
                        arryOpenMailTask2.push(response2.openMail[xData2Index]);
                    }
                }

                let xdatasIndex = newConcatXdatas.findIndex(d => d == "");
                let xdatas = newConcatXdatas;
                if (xdatasIndex != -1) {
                    xdatas[xdatasIndex] = "無部門";
                }

                let aa = xdatas.length % 10 == 0 ? parseInt(xdatas.length / 10) : parseInt(xdatas.length / 10) + 1;

                setDomainResponseTaskXDatasEchartNum(xdatas.length % 10 == 0 ? parseInt(xdatas.length / 10) : parseInt(xdatas.length / 10) + 1);
                setDomainResponseTaskXDatas(xdatas);
                setDomainResponseTask1ClickLink(arryClickLinkTask1);
                setDomainResponseTask2ClickLink(arryClickLinkTask2);
                setDomainResponseTask1InputData(arryInputDataTask1);
                setDomainResponseTask2InputData(arryInputDataTask2);
                setDomainResponseTask1OpenAppendix(arryOpenAppendixTask1);
                setDomainResponseTask2OpenAppendix(arryOpenAppendixTask2);
                setDomainResponseTask1OpenMail(arryOpenMailTask1);
                setDomainResponseTask2OpenMail(arryOpenMailTask2);

                setDomainResponseTask1ClickLinkToolTip(arryClickLinkToolTipTask1);
                setDomainResponseTask2ClickLinkToolTip(arryClickLinkToolTipTask2);
                setDomainResponseTask1InputDataToolTip(arryInputDataToolTipTask1);
                setDomainResponseTask2InputDataToolTip(arryInputDataToolTipTask2);
                setDomainResponseTask1OpenAppendixToolTip(arryOpenAppendixToolTipTask1);
                setDomainResponseTask2OpenAppendixToolTip(arryOpenAppendixToolTipTask2);
            }
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getActionChartResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    const loadRef = (index, total) => {
        //console.log(domainChartRef.current[index]);

        if (index == total - 1 || total == null) {
            //console.log(domainChartRef.current);
            setFinishedDomainResponseImg(domainChartRef.current);
        }
    }

    return (
        <>
            {
                [...new Array(domainResponseTaskXDatasEchartNum)].map((data, index) => {
                    let newXDatas = domainResponseTaskXDatas;
                    let sliceXDatas = newXDatas ? newXDatas.slice(index * 10, (index + 1) * 10) : [];

                    let newOpenMail1 = domainResponseTask1OpenMail;
                    if (task.length == 2 && domainResponseTask1OpenMail && domainResponseTask1OpenMail.length > 0) {
                        newOpenMail1 = domainResponseTask1OpenMail.map((value, index) => {
                            return value + domainResponseTask2OpenMail[index];
                        });
                    }
                    let sliceOpenMail1 = newOpenMail1 ? newOpenMail1.slice(index * 10, (index + 1) * 10) : [];

                    let newClickLink1 = domainResponseTask1ClickLink;
                    if (task.length == 2 && domainResponseTask1ClickLink && domainResponseTask1ClickLink.length > 0) {
                        newClickLink1 = domainResponseTask1ClickLink.map((value, index) => {
                            return value + domainResponseTask2ClickLink[index];
                        });
                    }
                    let sliceClickLink1 = newClickLink1 ? newClickLink1.slice(index * 10, (index + 1) * 10) : [];

                    let newInputData1 = domainResponseTask1InputData;
                    if (task.length == 2 && domainResponseTask1InputData && domainResponseTask1InputData.length > 0) {
                        newInputData1 = domainResponseTask1InputData.map((value, index) => {
                            return value + domainResponseTask2InputData[index];
                        });
                    }
                    let sliceInputData1 = newInputData1 ? newInputData1.slice(index * 10, (index + 1) * 10) : [];

                    let newOpenAppendix1 = domainResponseTask1OpenAppendix;
                    if (task.length == 2 && domainResponseTask1OpenAppendix && domainResponseTask1OpenAppendix.length > 0) {
                        newOpenAppendix1 = domainResponseTask1OpenAppendix.map((value, index) => {
                            return value + domainResponseTask2OpenAppendix[index];
                        });
                    }
                    let sliceOpenAppendix1 = newOpenAppendix1 ? newOpenAppendix1.slice(index * 10, (index + 1) * 10) : [];

                    //let newOpenMail2 = domainResponseTask2OpenMail;
                    //let sliceOpenMail2 = newOpenMail2 && task.length == 2 ? newOpenMail2.slice(index * 10, (index + 1) * 10) : [];

                    //let newClickLink2 = domainResponseTask2ClickLink;
                    //let sliceClickLink2 = newClickLink2 && task.length == 2 ? newClickLink2.slice(index * 10, (index + 1) * 10) : [];

                    //let newInputData2 = domainResponseTask2InputData;
                    //let sliceInputData2 = newInputData2 && task.length == 2 ? newInputData2.slice(index * 10, (index + 1) * 10) : [];

                    //let newOpenAppendix2 = domainResponseTask2OpenAppendix;
                    //let sliceOpenAppendix2 = newOpenAppendix2 && task.length == 2 ? newOpenAppendix2.slice(index * 10, (index + 1) * 10) : [];

                    return (<Bar key={index} ref={(el) => { domainChartRef.current[index] = el; loadRef(index, domainResponseTaskXDatasEchartNum); }}
                        style={{ display: 'none' }}
                        data={
                            //task.length == 2 ?
                            //    {
                            //        labels: sliceXDatas,
                            //        datasets: [
                            //            {
                            //                label: '僅開啟電子信箱',
                            //                backgroundColor: "#4F94D4",
                            //                data: sliceOpenMail1,
                            //                borderColor: '#4F94D4',
                            //                type: 'line'
                            //            },
                            //            {
                            //                label: '點擊連結',
                            //                backgroundColor: "#78A8FF",
                            //                data: sliceClickLink1,
                            //                borderWidth: 0,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 0',
                            //                pointStyle: 'rect'
                            //            },
                            //            {
                            //                label: '輸入資料',
                            //                backgroundColor: "#38D7E7",
                            //                data: sliceInputData1,
                            //                borderWidth: 0,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 0',
                            //                pointStyle: 'rect'
                            //            },
                            //            {
                            //                label: '打開附件',
                            //                backgroundColor: "#FF6F3D",
                            //                data: sliceOpenAppendix1,
                            //                borderWidth: 0,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 0',
                            //                pointStyle: 'rect'
                            //            },
                            //            {
                            //                label: '僅開啟電子信箱',
                            //                backgroundColor: "#FFFFFF",
                            //                borderColor: '#84C2E1',
                            //                data: sliceOpenMail2,
                            //                borderColor: '#38D7E7',
                            //                type: 'line'
                            //            },
                            //            {
                            //                label: '點擊連結',
                            //                backgroundColor: "#E6EEFF",
                            //                borderColor: "#78A8FF",
                            //                data: sliceClickLink2,
                            //                borderWidth: 2,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 1',
                            //                pointStyle: 'rect'
                            //            },
                            //            {
                            //                label: '輸入資料',
                            //                backgroundColor: "#E8FBFC",
                            //                borderColor: "#38D7E7",
                            //                data: sliceInputData2,
                            //                borderWidth: 2,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 1',
                            //                pointStyle: 'rect'
                            //            },
                            //            {
                            //                label: '打開附件',
                            //                backgroundColor: "#FFECE6",
                            //                borderColor: "#FF6F3D",
                            //                data: sliceOpenAppendix2,
                            //                borderWidth: 2,
                            //                barPercentage: 0.4,
                            //                maxBarThickness: 40,
                            //                stack: 'Stack 1',
                            //                pointStyle: 'rect'
                            //            }
                            //        ]
                            //    } :
                            {
                                labels: sliceXDatas,
                                datasets: [
                                    {
                                        label: '僅開啟電子信箱',
                                        backgroundColor: "#4F94D4",
                                        data: sliceOpenMail1,
                                        borderColor: '#4F94D4',
                                        type: 'line'
                                    },
                                    {
                                        label: '點擊連結',
                                        backgroundColor: "#78A8FF",
                                        data: sliceClickLink1,
                                        borderWidth: 0,
                                        barPercentage: 0.4,
                                        maxBarThickness: 40,
                                        stack: 'Stack 0',
                                        pointStyle: 'rect'
                                    },
                                    {
                                        label: '輸入資料',
                                        backgroundColor: "#38D7E7",
                                        data: sliceInputData1,
                                        borderWidth: 0,
                                        barPercentage: 0.4,
                                        maxBarThickness: 40,
                                        stack: 'Stack 0',
                                        pointStyle: 'rect'
                                    },
                                    {
                                        label: '打開附件',
                                        backgroundColor: "#FF6F3D",
                                        data: sliceOpenAppendix1,
                                        borderWidth: 0,
                                        barPercentage: 0.4,
                                        maxBarThickness: 40,
                                        stack: 'Stack 0',
                                        pointStyle: 'rect'
                                    }
                                ]
                            }
                        }
                        options={{
                            animation: true,
                            responsive: true,
                            scales: {
                                x: {
                                    stacked: true,
                                    ticks: {
                                        font: {
                                            size: 23
                                        }
                                    }
                                },
                                y: {
                                    stacked: true,
                                    ticks: {
                                        font: {
                                            size: 25
                                        }
                                    }
                                },
                            },
                            plugins: {
                                datalabels: {
                                    display: false
                                },
                                deferred: {
                                    xOffset: 150,
                                    yOffset: '50%',
                                    delay: 200
                                },
                                legend: {
                                    labels: {
                                        font: {
                                            size: 25
                                        },
                                        usePointStyle: true
                                    },
                                    position: 'bottom',
                                    display: true,
                                },
                                title: {
                                    display: false,

                                }
                            }
                        }}
                    />)
                })
            }
        </>
    );
}
//#endregion

//#region 回應詳情Component
const DownloadDetailResponseChart = (props) => {
    const { runPDF, task, setFinishedDetailResponse, setFinishedDetailResponseTable } = props;
    const [toastObj, setToastObj] = useState(null); //顯示toast
    const [respondDetail, setRespondDetail] = useState([
        {
            "type": 1,
            "count": 0,
            "expand": false,
            "detail": []
        },
        {
            "type": 2,
            "count": 0,
            "expand": false,
            "detail": []
        },
        {
            "type": 3,
            "count": 0,
            "expand": false,
            "detail": []
        },
        {
            "type": 4,
            "count": 0,
            "expand": false,
            "detail": []
        }
    ]); //回應詳情

    //#region 初始載入
    useEffect(() => {
        const fetchData = async () => {
            if (runPDF) {
                for (let i = 1; i <= 4; i++) {
                    let sendData4 = {
                        ids: task,
                        type: i
                    };
                    let result = await ApiGetActionDetailFunc(sendData4);

                    if (i == 4 && result) {
                        setFinishedDetailResponse(true);
                        setFinishedDetailResponseTable(respondDetail);
                    }
                }
            }
        };
        fetchData();
    }, [runPDF]);
    //#endregion

    //#region 取得各項回應詳情(ids)API
    const ApiGetActionDetailFunc = async (sendData) => {
        let result = false;
        let getActionDetailResponse = await apiGetActionDetail(sendData);
        //console.log("取得各項回應詳情(ids)", getActionDetailResponse);

        if (getActionDetailResponse && getActionDetailResponse.code == "0000") {
            let newRespondDetail = [...respondDetail];
            newRespondDetail[sendData.type - 1].detail = getActionDetailResponse.result;
            newRespondDetail[sendData.type - 1].expand = !newRespondDetail[sendData.type - 1].expand;
            setRespondDetail(newRespondDetail);
            result = true;
        }
        else {
            setToastObj({
                alert: "alert",
                type: "",
                msg: getActionDetailResponse.message,
                time: 1500
            });
        }

        return result;
    }
    //#endregion

    return (
        <></>
    );
}
//#endregion