function ignore(e) {
    const target = e.target;
    const tripIndex = target.getAttribute("data-trip-index");
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
    const target =
        e.target.parentElement.parentElement.getAttribute("data-name");
    const prevTarget =
        e.target.parentElement.parentElement.previousElementSibling?.getAttribute(
            "data-name"
        );

    if (!prevTarget) return alert("맨 처음입니다");

    const order = getOrder();
    const targetIndex = order.findIndex((item) => item.worker === target);
    const prevTargetIndex = order.findIndex(
        (item) => item.worker === prevTarget
    );
    const prev = order[prevTargetIndex];

    order.splice(prevTargetIndex, 1);
    order.splice(targetIndex, 0, prev);

    localStorage.setItem("order", JSON.stringify(order));
    render();
}

function orderDown(e) {
    const target =
        e.target.parentElement.parentElement.getAttribute("data-name");
    const nextTarget =
        e.target.parentElement.parentElement.nextElementSibling?.getAttribute(
            "data-name"
        );

    if (!nextTarget) return alert("맨 마지막입니다");

    const order = getOrder();
    const targetIndex = order.findIndex((item) => item.worker === target);
    const nextTargetIndex = order.findIndex(
        (item) => item.worker === nextTarget
    );
    const next = order[nextTargetIndex];

    order.splice(nextTargetIndex, 1);
    order.splice(targetIndex, 0, next);

    localStorage.setItem("order", JSON.stringify(order));
    render();
}

function orderDelete(e) {
    if (confirm("정말 삭제하시겠습니까?")) {
        const target =
            e.target.parentElement.parentElement.getAttribute("data-name");
        const order = getOrder().filter((item) => item.worker !== target);
        const renderData = getRenderData().filter(
            (item) => item.worker !== target
        );
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
    const order = getOrder();
    const thead = document.querySelector("thead");
    const tbody = document.querySelector("tbody");
    const year = localStorage.getItem("year");
    const month = Number(localStorage.getItem("month"));
    const publicCar = JSON.parse(localStorage.getItem("public-car"));
    const personInfoBody = document.querySelector("#person-info-body");

    document.querySelector(
        "#document-title"
    ).innerText = `${localStorage.getItem("team")} 출장여비 내역서`;

    thead.innerHTML = `
    <tr>
        <th rowspan="2">직급</th>
        <th rowspan="2">성명</th>
        ${publicCar ? '<th rowspan="2">관용차사용여부</th>' : ""}
        <th colspan="2" id="trip-period">출장기간 : ${year}. ${
        month + 1
    }. 1. ~ ${year}. ${month + 1}. ${new Date(
        year,
        month + 1,
        0
    ).getDate()}.</th>
        <th rowspan="2">출장일수</th>
        <th rowspan="2">단가</th>
        <th rowspan="2">지급액<br />소계</th>
        <th rowspan="2">입금계좌</th>
        <th rowspan="2">지급액<br />합계</th>
        </tr>
    <tr>
        <th colspan="2" id="trip-date">출장일</th>
    </tr>
        <tr id="sum-row"></tr>
    `;

    document.querySelector(
        "#checker"
    ).innerText = `확인자 : ${localStorage.getItem(
        "degree"
    )} ${localStorage.getItem("name")} (인)`;

    personInfoBody.innerHTML = "";
    tbody.innerHTML = "";
    document.querySelector("#sum-row").innerHTML = "";

    let totalTrip = 0;
    let totalMoney = 0;

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
            const dataIndex = renderData.findIndex(
                (item) => item.worker === worker
            );
            const target = renderData[dataIndex].tripData;
            const up240AndUseCar = [];
            const up240 = [];
            const down240 = [];
            const totalArr = [];

            target.forEach((data) => {
                data.trip.forEach(({ isUp240, isUseCar, ignore }, index) => {
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
                <td class="trip-date-count">${
                    up240AndUseCar.length === 0 ? "-" : up240AndUseCar.length
                }</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${
                    up240AndUseCar.length === 0
                        ? "-"
                        : commaGenerator(up240AndUseCarMoney)
                }</td>
                <td rowspan="3" class="account">${
                    account
                        ? `${account.split(" ")[0]} <br/>${
                              account.split(" ")[1]
                          }`
                        : ""
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
                <td class="trip-date-count">${
                    down240.length === 0 ? "-" : down240.length
                }</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${
                    down240.length === 0 ? "-" : commaGenerator(down240Money)
                }</td>
            </tr>
            <tr>
                <!-- 관차미사용 및 4시간이상 -->
                <td class="time-vary">4시간 이상</td>
                <!-- 날짜 -->
                <td>${up240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${
                    up240.length === 0 ? "-" : up240.length
                }</td>
                <td class="trip-price">20,000</td>
                <td class="small-total">${
                    up240.length === 0 ? "-" : commaGenerator(up240Money)
                }</td>
            </tr> 
            `
                : `
            <tr>
                <!-- 4시간 미만 -->
                <td rowspan="2">${degree ?? ""}</td>
                <td rowspan="2">${worker}</td>
                <td class="time-vary">4시간 미만</td>
                <!-- 날짜 -->
                <td>${down240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${
                    down240.length === 0 ? "-" : down240.length
                }</td>
                <td class="trip-price">10,000</td>
                <td class="small-total">${
                    down240.length === 0 ? "-" : commaGenerator(down240Money)
                }</td>
                <td rowspan="2" class="account">${account.split(" ")[0]} <br/>${
                      account.split(" ")[1]
                  }</td>
                <td rowspan="2" class="total-money">${commaGenerator(
                    down240Money + up240Money
                )}</td>
            </tr>
            <tr>
                <!-- 관차미사용 및 4시간 미만 -->
                <td class="time-vary">4시간 이상</td>
                <!-- 날짜 -->
                <td>${up240.map((date) => date).join(", ")}</td>
                <td class="trip-date-count">${
                    up240.length === 0 ? "-" : up240.length
                }</td>
                <td class="trip-price">20,000</td>
                <td class="small-total">${
                    up240.length === 0 ? "-" : commaGenerator(up240Money)
                }</td>
            </tr>
            `;
            tbody.innerHTML += result;

            totalArr.sort((a, b) => {
                if (a.date > b.date) return 1;
                if (a.date == b.date) return 0;
                if (a.date < b.date) return -1;
            });

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
    <th colspan="5" class="total-sum-money">총 ${commaGenerator(
        totalMoney
    )}원</th>
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
            const result = {
                tripData: [],
            };

            if (json[0].__EMPTY_8.replace(/\s/g, "") !== "출장내역서")
                reject("formatError");

            for (let i = json.length - 2; i > 1; i--) {
                const data = json[i];
                if (i === json.length - 2) result.worker = data.__EMPTY_13;
                const {
                    __EMPTY_3: start,
                    __EMPTY_4: end,
                    __EMPTY_9: publicCar,
                } = data;
                const startDate = new Date(start);
                if (
                    startDate.getMonth() !== month ||
                    startDate.getFullYear() !== year
                )
                    reject("notMatch");

                const period = new Date(end).getTime() - startDate.getTime();
                const minutePeriod = period / (1000 * 60);
                if (publicCar === "사용" && minutePeriod < 240) {
                    continue;
                }
                const prev = result.tripData[result.tripData.length - 1];

                if (
                    i !== json.length - 2 &&
                    prev.date === startDate.getDate()
                ) {
                    const isUp240 = minutePeriod >= 240 ? true : false;
                    const isUseCar = publicCar === "사용" ? true : false;
                    if (
                        prev.trip.length > 2 ||
                        (prev.trip[0].isUp240 && !prev.trip[0].isUseCar)
                    )
                        continue;
                    if (isUp240 && !isUseCar) {
                        prev.trip = [
                            {
                                isUp240,
                                isUseCar,
                            },
                        ];
                    } else {
                        prev.trip.push({ isUp240, isUseCar });
                    }
                } else {
                    result.tripData.push({
                        date: startDate.getDate(),
                        trip: [
                            {
                                isUp240: minutePeriod >= 240 ? true : false,
                                isUseCar: publicCar === "사용" ? true : false,
                            },
                        ],
                    });
                }
            }
            resolve(result);
        };
    });
}

if (
    localStorage.getItem("degree") ||
    localStorage.getItem("name") ||
    localStorage.getItem("team")
) {
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

document.querySelector("#info-submit").addEventListener("click", () => {
    const degree = document.querySelector("#degree").value;
    const name = document.querySelector("#name").value;
    const team = document.querySelector("#team").value;
    const carTrue = document.querySelector("#car-true").value;

    carTrue
        ? localStorage.setItem("public-car", true)
        : localStorage.setItem("public-car", false);
    localStorage.setItem("degree", degree);
    localStorage.setItem("team", team);
    localStorage.setItem("name", name);
    document.querySelector("#info-modal").style.display = "none";
    render();
});

document.querySelector("#team").addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        const degree = document.querySelector("#degree").value;
        const name = document.querySelector("#name").value;
        const team = document.querySelector("#team").value;
        const carTrue = document.querySelector("#car-true").value;

        carTrue
            ? localStorage.setItem("public-car", true)
            : localStorage.setItem("public-car", false);
        localStorage.setItem("degree", degree);
        localStorage.setItem("team", team);
        localStorage.setItem("name", name);
        document.querySelector("#info-modal").style.display = "none";
        render();
    }
});

document.querySelector("#excel-input").addEventListener("input", async (e) => {
    const promiseArr = [];
    [...e.target.files].forEach((file) => promiseArr.push(readExcel(file)));
    try {
        const fileDatas = await Promise.all(promiseArr);
        const originData = getRenderData() ?? [];
        const originOrder = getOrder() ?? [];

        fileDatas.forEach((data) => {
            const originIndex = originData.findIndex(
                (item) => item.worker === data.worker
            );

            if (originIndex == -1) {
                originData.push(data);
                originOrder.push({
                    worker: data.worker,
                    account: "",
                    degree: "",
                });
            } else {
                originData.splice(originIndex, 1);
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
document
    .querySelector("#person-info-revise-btn")
    .addEventListener("click", (e) => {
        const order = getOrder();
        const renderData = getRenderData();
        const personInfoBody = document.querySelector("#person-info-body");

        if (e.target.innerText === "저장") {
            e.target.innerText = "수정";
            const personInfoItems = [
                ...document.querySelectorAll(".person-info-item"),
            ].map((elem) => {
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
                const infoData = personInfoItems.filter(
                    (item) => item.name === orderData.worker
                )[0];
                orderData.account = `${infoData.bank} ${infoData.account}`;
                orderData.degree = infoData.degree;
            });
            document.querySelector(
                "#person-info-header .col-account"
            ).style.flex = "";
            document.querySelector(
                "#person-info-header .col-workdate"
            ).style.flex = "";
            localStorage.setItem("order", JSON.stringify(order));
            render();
            return;
        }

        if (e.target.innerText === "수정") {
            e.target.innerText = "저장";
            personInfoBody.innerHTML = "";
            order.forEach(({ worker, account, degree }) => {
                const dataIndex = renderData.findIndex(
                    (item) => item.worker === worker
                );
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
                totalArr.sort((a, b) => {
                    if (a.date > b.date) return 1;
                    if (a.date == b.date) return 0;
                    if (a.date < b.date) return -1;
                });

                document.querySelector(
                    "#person-info-header .col-account"
                ).style.flex = 2;
                document.querySelector(
                    "#person-info-header .col-workdate"
                ).style.flex = 1;
                personInfoBody.innerHTML += `
                <div class="person-info-item" data-name=${worker}>
                    <div class="col-name">${worker}</div>
                    <div class="col-degree"><input type="text" class="degree-input" value="${
                        degree ?? ""
                    }" /></div>
                    <div class="col-bank"><input type="text" class="bank-input" value="${
                        account.split(" ")[0] ?? ""
                    }" /></div>
                    <div class="col-account" style="flex:2;"><input type="text" class="account-input" value="${
                        account.split(" ")[1] ?? ""
                    }" /></div>
                    <div class="col-workdate" style="flex:1;">
                    ${totalArr
                        .map(
                            ({ date, tripIndex, ignore }) =>
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

document.querySelector("#setting-btn").addEventListener("click", () => {
    console.log("세팅");
});
render();
