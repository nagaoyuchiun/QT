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
