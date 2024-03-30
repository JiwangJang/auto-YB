function getUUID() {
    return `${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}${Math.floor(
        Math.random() * 9
    )}${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 9)}`;
}

function ignore(e) {
    const target = e.target;
    const tripIndex = target.getAttribute("data-trip-index");
    const tripId = target.getAttribute("data-trip-id");
    const date = Number(target.innerText);
    const name = target.parentElement.parentElement.getAttribute("data-name");
    const renderData = getRenderData();
    const isAlreadyIgnore = target.classList.contains("ignore");

    renderData.forEach((item) => {
        if (item.worker === name) {
            item.tripData.forEach((trip) => {
                if (trip.date === date) {
                    trip.trip[tripIndex].ignore = !isAlreadyIgnore;
                }
            });
        }
    });

    setRenderData(renderData);
    render();
}

function orderUp(e) {
    const target = e.target.parentElement.parentElement.getAttribute("data-name");
    const prevTarget = e.target.parentElement.parentElement.previousElementSibling?.getAttribute("data-name");

    if (!prevTarget) return alert("맨 처음입니다");

    const order = getOrder();
    const targetIndex = order.findIndex((item) => item.worker === target);
    const prevTargetIndex = order.findIndex((item) => item.worker === prevTarget);
    const prev = order[prevTargetIndex];

    order.splice(prevTargetIndex, 1);
    order.splice(targetIndex, 0, prev);

    localStorage.setItem("order", JSON.stringify(order));
    render();
}

function orderDown(e) {
    const target = e.target.parentElement.parentElement.getAttribute("data-name");
    const nextTarget = e.target.parentElement.parentElement.nextElementSibling?.getAttribute("data-name");

    if (!nextTarget) return alert("맨 마지막입니다");

    const order = getOrder();
    const targetIndex = order.findIndex((item) => item.worker === target);
    const nextTargetIndex = order.findIndex((item) => item.worker === nextTarget);
    const next = order[nextTargetIndex];

    order.splice(nextTargetIndex, 1);
    order.splice(targetIndex, 0, next);

    localStorage.setItem("order", JSON.stringify(order));
    render();
}

function orderDelete(e) {
    if (confirm("정말 삭제하시겠습니까?")) {
        const target = e.target.parentElement.parentElement.getAttribute("data-name");
        const order = getOrder().filter((item) => item.worker !== target);
        const renderData = getRenderData().filter((item) => item.worker !== target);
        localStorage.setItem("order", JSON.stringify(order));
        setRenderData(renderData);
        render();
    }
}

function commaGenerator(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getRenderData() {
    const year = localStorage.getItem("year");
    const month = Number(localStorage.getItem("month"));
    if (localStorage.getItem(`${year}-${month}`)) {
        return JSON.parse(localStorage.getItem(`${year}-${month}`));
    } else {
        localStorage.setItem(`${year}-${month}`, "[]");
        return [];
    }
}

function getOrder() {
    return JSON.parse(localStorage.getItem("order"));
}

function setRenderData(data) {
    const year = localStorage.getItem("year");
    const month = Number(localStorage.getItem("month"));
    localStorage.setItem(`${year}-${month}`, JSON.stringify(data));
}

function render() {
    const renderData = getRenderData();
    const order = getOrder() ?? [];
    const thead = document.querySelector("thead");
    const tbody = document.querySelector("tbody");
    const year = localStorage.getItem("year");
    const month = Number(localStorage.getItem("month"));
    const publicCar = JSON.parse(localStorage.getItem("public-car"));
    const personInfoBody = document.querySelector("#person-info-body");

    publicCar ? tbody.classList.add("public-car") : tbody.classList.remove("public-car");
    document.querySelector("#document-title").innerText = `${localStorage.getItem("team")} 출장여비 내역서`;

    thead.innerHTML = `
    <tr>
        <th rowspan="2" id="table-degree-header">직급</th>
        <th rowspan="2" id="table-name-header">성명</th>
        ${publicCar ? '<th rowspan="2" id="table-public-car-header">관용차 <br />사용여부</th>' : ""}
        <th colspan="2" id="trip-period">출장기간 : ${year}. ${month + 1}. 1. ~ ${year}. ${month + 1}. ${new Date(
        year,
        month + 1,
        0
    ).getDate()}.</th>
        <th rowspan="2" id="table-trip-date-header">출장일수</th>
        <th rowspan="2" id="table-trip-price-header">단가</th>
        <th rowspan="2" id="table-small-total-header">지급액<br />소계</th>
        <th rowspan="2" id="table-account-header">입금계좌</th>
        <th rowspan="2" id="table-total-header">지급액<br />합계</th>
    </tr>
    <tr>
        <th colspan="2" id="trip-date">출장일</th>
    </tr>
        <tr id="sum-row">
    </tr>
    `;

    document.querySelector("#checker").innerText = `확인자 : ${localStorage.getItem("degree")} ${localStorage.getItem(
        "name"
    )} (인)`;

    personInfoBody.innerHTML = "";
    tbody.innerHTML = "";
    document.querySelector("#sum-row").innerHTML = "";

    let totalTrip = 0;
    let totalMoney = 0;

    // 직원 순서에 따라서 렌더링
    order.forEach(({ worker, account, degree }) => {
        if (renderData.length === 0) {
            personInfoBody.innerHTML += `
            <div class="person-info-item" data-name=${worker}>
                <div class="col-name">${worker}</div>
                <div class="col-degree">${degree}</div>
                <div class="col-bank">${account.split(" ")[0]}</div>
                <div class="col-account">${account.split(" ")[1] ?? ""}</div>
                <div class="col-workdate">
                </div>
                <div class="col-util">
                    <div class="order-up" onclick="orderUp(event)"></div>
                    <div class="order-down" onclick="orderDown(event)"></div>
                    <div class="order-delete" onclick="orderDelete(event)"></div>
                </div>
            </div>
            `;
        } else {
            const dataIndex = renderData.findIndex((item) => item.worker === worker);
            if (dataIndex === -1) return;
            const target = renderData[dataIndex].tripData;
            const up240AndUseCar = [];
            const up240 = [];
            const down240 = [];
            const totalArr = [];
            target.forEach((data) => {
                data.trip.forEach(({ isUp240, isUseCar, ignore }, index) => {
                    if (!publicCar && isUseCar) return;
                    totalArr.push({
                        date: data.date,
                        tripIndex: index,
                        ignore,
                    });
                    if (ignore) return;
                    if (isUp240) {
                        if (isUseCar) up240AndUseCar.push(data.date);
                        else up240.push(data.date);
                    } else down240.push(data.date);
                    totalTrip++;
                });
            });

            console.log(up240, down240, up240AndUseCar);
            const up240AndUseCarMoney = up240AndUseCar.length * 10000;
            const up240Money = up240.length * 20000;
            const down240Money = down240.length * 10000;
            totalMoney += up240AndUseCarMoney + up240Money + down240Money;

            const result = publicCar
                ? `
            <tr>
                <!-- 관차사용 및 4시간이상 -->
                <td rowspan="3" class="degree">${degree ?? ""}</td>
                <td rowspan="3" class="worker-name">${worker}</td>
                <td>사용</td>
                <td class="time-vary">4시간 이상</td>
                <!-- 날짜 -->
                <td>${up240AndUseCar.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${up240AndUseCar.length === 0 ? "-" : up240AndUseCar.length}</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${up240AndUseCar.length === 0 ? "-" : commaGenerator(up240AndUseCarMoney)}</td>
                <td rowspan="3" class="account">${
                    account ? `${account.split(" ")[0]} <br/>${account.split(" ")[1]}` : ""
                }</td>
                <td rowspan="3" class="total-money">${commaGenerator(
                    down240Money + up240Money + up240AndUseCarMoney
                )}</td>
            </tr>
            <tr>
                <!-- 관차미사용 및 4시간 미만 -->
                <td rowspan="2">미사용</td>
                <td class="time-vary">4시간 미만</td>
                <!-- 날짜 -->
                <td>${down240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${down240.length === 0 ? "-" : down240.length}</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${down240.length === 0 ? "-" : commaGenerator(down240Money)}</td>
            </tr>
            <tr>
                <!-- 관차미사용 및 4시간이상 -->
                <td class="time-vary">4시간 이상</td>
                <!-- 날짜 -->
                <td>${up240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${up240.length === 0 ? "-" : up240.length}</td>
                <td class="trip-price">20,000</td>
                <td class="small-total">${up240.length === 0 ? "-" : commaGenerator(up240Money)}</td>
            </tr> 
            `
                : `
            <tr>
                <!-- 4시간 미만 -->
                <td rowspan="2" class="degree">${degree ?? ""}</td>
                <td rowspan="2" class="worker-name">${worker}</td>
                <td class="time-vary">4시간 미만</td>
                <!-- 날짜 -->
                <td>${down240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${down240.length === 0 ? "-" : down240.length}</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${down240.length === 0 ? "-" : commaGenerator(down240Money)}</td>
                <td rowspan="2" class="account">${
                    account ? `${account.split(" ")[0]} <br/>${account.split(" ")[1]}` : ""
                }</td>
                <td rowspan="2" class="total-money">${commaGenerator(down240Money + up240Money)}</td>
            </tr>
            <tr>
                <!-- 관차미사용 및 4시간 미만 -->
                <td class="time-vary">4시간 이상</td>
                <!-- 날짜 -->
                <td>${up240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${up240.length === 0 ? "-" : up240.length}</td>
                <td class="trip-price">20,000</td>
                <td class="small-total">${up240.length === 0 ? "-" : commaGenerator(up240Money)}</td>
            </tr>
            `;
            tbody.innerHTML += result;

            personInfoBody.innerHTML += `
            <div class="person-info-item" data-name=${worker}>
                <div class="col-name">${worker}</div>
                <div class="col-degree">${degree}</div>
                <div class="col-bank">${account.split(" ")[0]}</div>
                <div class="col-account">${account.split(" ")[1] ?? ""}</div>
                <div class="col-workdate">
                ${totalArr
                    .map(
                        ({ date, tripIndex, ignore }) =>
                            `<div class="workdate ${
                                ignore ? "ignore" : ""
                            }" onclick="ignore(event)" data-trip-index=${tripIndex}>${date}</div>`
                    )
                    .join("")}
                </div>
                <div class="col-util">
                    <div class="order-up" onclick="orderUp(event)"></div>
                    <div class="order-down" onclick="orderDown(event)"></div>
                    <div class="order-delete" onclick="orderDelete(event)"></div>
                </div>
            </div>
            `;
        }
    });
    document.querySelector("#sum-row").innerHTML += `
    <th colspan="${publicCar ? 3 : 2}">출장자 : ${order.length}명</th>
    <th colspan="3">총 ${totalTrip}회</th>
    <th colspan="5" class="total-sum-money">총 ${commaGenerator(totalMoney)}원</th>
  `;
}

function readExcel(file) {
    const year = Number(localStorage.getItem("year"));
    const month = Number(localStorage.getItem("month"));
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = (e) => {
            const fileResult = e.target.result;
            const workbook = XLSX.read(fileResult);
            const targetSheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(targetSheet);

            if (json[0].__EMPTY_8.replace(/\s/g, "") !== "출장내역서") reject("formatError");

            const result = json.reduce(
                (acc, item, i) => {
                    if (item.__EMPTY_1 !== "관내") return acc;
                    if (i === 2) acc.worker = item.__EMPTY_13;
                    const { __EMPTY_3: start, __EMPTY_4: end, __EMPTY_9: publicCar } = item;
                    const startDate = new Date(start);
                    if (startDate.getMonth() !== month || startDate.getFullYear() !== year) reject("notMatch");

                    const period = new Date(end).getTime() - startDate.getTime();
                    const minutePeriod = period / (1000 * 60);
                    if (publicCar === "사용" && minutePeriod < 240) return acc;
                    const redundant = acc.tripData.filter((item) => item.date === startDate.getDate())[0];
                    const isUp240 = minutePeriod >= 240 ? true : false;
                    const isUseCar = publicCar === "사용" ? true : false;

                    if (redundant) {
                        if (redundant.trip.length > 2 || (redundant.trip[0].isUp240 && !redundant.trip[0].isUseCar))
                            return acc;
                        if (isUp240 && !isUseCar) {
                            redundant.trip = [
                                {
                                    isUp240,
                                    isUseCar,
                                },
                            ];
                        } else {
                            redundant.trip.push({
                                isUp240,
                                isUseCar,
                            });
                        }
                    } else {
                        acc.tripData.unshift({
                            date: startDate.getDate(),
                            trip: [
                                {
                                    isUp240,
                                    isUseCar,
                                },
                            ],
                        });
                    }

                    return acc;
                },
                {
                    tripData: [],
                }
            );
            resolve(result);
        };
    });
}

if (localStorage.getItem("degree") || localStorage.getItem("name") || localStorage.getItem("team")) {
    document.querySelector("#info-modal").style.display = "none";
}

if (!localStorage.getItem("year") || !localStorage.getItem("month")) {
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    if (month - 1 < 0) {
        localStorage.setItem("month", 11);
        localStorage.setItem("year", year - 1);
    } else {
        localStorage.setItem("year", year);
        localStorage.setItem("month", month - 1);
    }
}

// 맨처음 정보입력 버튼
document.querySelector("#info-submit").addEventListener("click", () => {
    const degree = document.querySelector("#degree").value;
    const name = document.querySelector("#name").value;
    const team = document.querySelector("#team").value;
    const carTrue = document.querySelector("#car-true").value;

    localStorage.setItem("public-car", carTrue ? true : false);
    localStorage.setItem("degree", degree);
    localStorage.setItem("team", team);
    localStorage.setItem("name", name);
    document.querySelector("#info-modal").style.display = "none";
    if (!localStorage.getItem("manual-check")) window.open("./manual/index.html");
    render();
});

// 맨처음 정보입력 할때 UX개선을 위해 마지막에 엔터누르면 되게 하는거
document.querySelector("#team").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const degree = document.querySelector("#degree").value;
        const name = document.querySelector("#name").value;
        const team = document.querySelector("#team").value;
        const carTrue = document.querySelector("#car-true").value;

        carTrue ? localStorage.setItem("public-car", true) : localStorage.setItem("public-car", false);
        localStorage.setItem("degree", degree);
        localStorage.setItem("team", team);
        localStorage.setItem("name", name);
        document.querySelector("#info-modal").style.display = "none";
        if (!localStorage.getItem("manual-check")) window.open("./manual/index.html");
        render();
    }
});

// 엑셀을 json으로 파싱하고, 로컬스토리지에 저장
document.querySelector("#excel-input").addEventListener("input", async (e) => {
    const promiseArr = [];
    [...e.target.files].forEach((file) => promiseArr.push(readExcel(file)));
    try {
        const fileDatas = await Promise.all(promiseArr);
        const originData = getRenderData() ?? [];
        const originOrder = getOrder() ?? [];
        fileDatas.forEach((data) => {
            const originDataIndex = originData.findIndex((item) => item.worker === data.worker);
            const originOrderIndex = originOrder.findIndex((item) => item.worker === data.worker);

            if (originDataIndex == -1) {
                originData.push(data);
                if (originOrderIndex == -1)
                    originOrder.push({
                        worker: data.worker,
                        account: "",
                        degree: "",
                    });
            } else {
                originData.splice(originDataIndex, 1);
                originData.push(data);
            }
        });
        localStorage.setItem("order", JSON.stringify(originOrder));
        setRenderData(originData);
        render();
    } catch (error) {
        if (error === "formatError") return alert("양식이 맞지 않습니다");
        if (error === "notMatch") return alert("날짜가 맞지 않습니다");
    }

    e.target.value = "";
});

// 직원별 정보입력란 수정버튼 누를때 동작
document.querySelector("#person-info-revise-btn").addEventListener("click", (e) => {
    const order = getOrder();
    const renderData = getRenderData();
    const personInfoBody = document.querySelector("#person-info-body");

    if (order.length === 0) return alert("직원부터 등록하세요");

    if (e.target.innerText === "저장") {
        e.target.innerText = "수정";
        const personInfoItems = [...document.querySelectorAll(".person-info-item")].map((elem) => {
            const name = elem.getAttribute("data-name");
            const degree = elem.querySelector(".degree-input").value;
            const bank = elem.querySelector(".bank-input").value;
            const account = elem.querySelector(".account-input").value;
            return {
                name,
                degree,
                bank,
                account,
            };
        });
        personInfoBody.innerHTML = "";
        order.forEach((orderData) => {
            const infoData = personInfoItems.filter((item) => item.name === orderData.worker)[0];
            if (!infoData) return;
            orderData.account = `${infoData.bank} ${infoData.account}`;
            orderData.degree = infoData.degree;
        });
        document.querySelector("#person-info-header .col-account").style.flex = "";
        document.querySelector("#person-info-header .col-workdate").style.flex = "";
        localStorage.setItem("order", JSON.stringify(order));
        render();
        return;
    }

    if (e.target.innerText === "수정") {
        e.target.innerText = "저장";
        personInfoBody.innerHTML = "";
        order.forEach(({ worker, account, degree }) => {
            const dataIndex = renderData.findIndex((item) => item.worker === worker);
            if (dataIndex === -1) return;
            const target = renderData[dataIndex].tripData;
            const totalArr = [];

            target.forEach((data) => {
                data.trip.forEach(({ ignore }, index) => {
                    totalArr.push({
                        date: data.date,
                        tripIndex: index,
                        ignore,
                    });
                });
            });

            document.querySelector("#person-info-header .col-account").style.flex = 2;
            document.querySelector("#person-info-header .col-workdate").style.flex = 1;
            personInfoBody.innerHTML += `
                <div class="person-info-item" data-name=${worker}>
                    <div class="col-name">${worker}</div>
                    <div class="col-degree"><input type="text" class="degree-input" value="${degree ?? ""}" /></div>
                    <div class="col-bank"><input type="text" class="bank-input" value="${
                        account.split(" ")[0] ?? ""
                    }" /></div>
                    <div class="col-account" style="flex:2;"><input type="text" class="account-input" value="${
                        account.split(" ")[1] ?? ""
                    }" /></div>
                    <div class="col-workdate" style="flex:1;">
                    ${totalArr
                        .map(
                            ({ date, tripIndex, ignore, id }) =>
                                `<div class="workdate revise ${
                                    ignore ? "ignore" : ""
                                }" data-trip-index=${tripIndex}>${date}</div>`
                        )
                        .join("")}
                    </div>
                    <div class="col-util revise">
                        <div class="order-up"></div>
                        <div class="order-down"></div>
                        <div class="order-delete"></div>
                    </div>
                </div>
                `;
        });
        return;
    }
});

// 이전달로 넘기는 버튼
document.querySelector("#prev").addEventListener("click", () => {
    const year = Number(localStorage.getItem("year"));
    const month = Number(localStorage.getItem("month"));

    if (month - 1 < 0) {
        localStorage.setItem("month", 11);
        localStorage.setItem("year", year - 1);
    } else {
        localStorage.setItem("month", month - 1);
    }

    render();
});

// 다음달로 넘기는 버튼
document.querySelector("#next").addEventListener("click", () => {
    const year = Number(localStorage.getItem("year"));
    const month = Number(localStorage.getItem("month"));

    if (month + 1 > 11) {
        localStorage.setItem("month", 0);
        localStorage.setItem("year", year + 1);
    } else {
        localStorage.setItem("month", month + 1);
    }

    render();
});

// 프린트 버튼 클릭시 동작
document.querySelector("#print").addEventListener("click", () => window.print());

// 설정 모달 띄워 주는거
document.querySelector("#setting-btn").addEventListener("click", () => {
    const settingModal = document.querySelector("#setting-modal");
    const name = localStorage.getItem("name");
    const degree = localStorage.getItem("degree");
    const team = localStorage.getItem("team");
    const publicCar = JSON.parse(localStorage.getItem("public-car"));

    settingModal.querySelector("#setting-degree").value = degree;
    settingModal.querySelector("#setting-name").value = name;
    settingModal.querySelector("#setting-team").value = team;
    publicCar
        ? (settingModal.querySelector("#setting-car-true").checked = true)
        : (settingModal.querySelector("#setting-car-false").checked = true);
    settingModal.classList.add("active");
});

// 설정다하고 설정완료 버튼 이벤트
document.querySelector("#setting-form").addEventListener("click", (e) => {
    if (e.target.tagName !== "BUTTON") return;

    switch (e.target.id) {
        case "setting-submit":
            const degree = document.querySelector("#setting-degree").value;
            const name = document.querySelector("#setting-name").value;
            const team = document.querySelector("#setting-team").value;
            const carTrue = document.querySelector("#setting-car-true").checked;

            localStorage.setItem("degree", degree);
            localStorage.setItem("name", name);
            localStorage.setItem("team", team);
            localStorage.setItem("public-car", carTrue ? true : false);
            document.querySelector("#setting-modal").classList.remove("active");
            render();
            break;
        case "setting-reset":
            if (confirm("정말 삭제하시겠습니까? 삭제후 복구가 안됩니다")) {
                localStorage.clear();
                window.location.reload();
            }
            break;
        case "setting-close":
            document.querySelector("#setting-modal").classList.remove("active");
            break;
    }
});

window.addEventListener("load", () => {
    document.querySelector("#loading").style.display = "none";
});

render();
