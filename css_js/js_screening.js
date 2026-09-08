// 今回のCSV形式（全体が"..."で囲まれた1行）に最適化したパース処理
function parseSpecialCSV(text) {
  const lines = text.split(/\r?\n/);
  const rows = [];

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // 行全体を囲む先頭・末尾の二重引用符を取り除く
    if (line.startsWith('"') && line.endsWith('"')) {
      line = line.slice(1, -1);
    }

    // エスケープされた "" を一時的な特殊文字に置換
    line = line.replace(/""/g, "\0");

    // カンマ区切りで分割
    const columns = line.split(",");

    // 特殊文字を通常の二重引用符に戻してトリム
    const cleanedColumns = columns.map(col => 
      col.replace(/\0/g, '"').trim()
    );

    rows.push(cleanedColumns);
  }

  return rows;
}

let stocks = [];

// CSVファイルの読み込み
fetch("https://docs.google.com/spreadsheets/d/e/2PACX-1vSSn7nE-4KwdT82uJPDoyLEfivQwIchd1j2ptDNSl77KAY7j3zak1Fqk6Oce19pk932IqPv8HhtpAWR/pub?gid=0&single=true&output=csv")
  .then(response => {
    if (!response.ok) {
      throw new Error("CSVを読み込めませんでした。");
    }
    return response.text();
  })
  .then(text => {
    const rows = parseSpecialCSV(text);

    // 1行目はヘッダーのため、2行目（i = 1）から処理
    for (let i = 1; i < rows.length; i++) {
      const columns = rows[i];

      if (columns.length < 6) continue;

      // 列構成: [0]コード, [1]銘柄名, [2]株価, [3]利回り, [4]PER, [5]PBR
      const price = parseFloat(columns[2]);
      const dividend = parseFloat(columns[3]);
      const per = parseFloat(columns[4]);
      const pbr = parseFloat(columns[5]);

      if (
        Number.isNaN(price) ||
        Number.isNaN(dividend) ||
        Number.isNaN(per) ||
        Number.isNaN(pbr)
      ) {
        continue;
      }

      stocks.push({
        code: columns[0],
        name: columns[1],
        price: price,
        dividend: dividend,
        per: per,
        pbr: pbr
      });
    }

    console.log("読み込んだ銘柄数：", stocks.length);
    console.log("最初の銘柄データ例：", stocks[0]);

    const btn = document.getElementById("searchButton");
    btn.textContent = "検索";
    btn.disabled = false;
  })
  .catch(error => {
    console.error("CSV読み込みエラー：", error);
    document.getElementById("result").innerHTML = "<p>株データを読み込めませんでした。</p>";
  });

// 検索処理
function searchStocks() {
  const maxPriceInput = parseFloat(document.getElementById("maxPrice").value);
  const minDividendInput = parseFloat(document.getElementById("minDividend").value);
  const maxPERInput = parseFloat(document.getElementById("maxPER").value);
  const maxPBRInput = parseFloat(document.getElementById("maxPBR").value);

  const maxPrice = Number.isNaN(maxPriceInput) ? Infinity : maxPriceInput;
  const minDividend = Number.isNaN(minDividendInput) ? -Infinity : minDividendInput;
  const maxPER = Number.isNaN(maxPERInput) ? Infinity : maxPERInput;
  const maxPBR = Number.isNaN(maxPBRInput) ? Infinity : maxPBRInput;

  // フィルタリング
  const results = stocks.filter(stock => {
    return (
      stock.price <= maxPrice &&
      stock.dividend >= minDividend &&
      stock.per <= maxPER &&
      stock.pbr <= maxPBR
    );
  });

  // 配当利回りの高い順にソート
  results.sort((a, b) => b.dividend - a.dividend);
  
  // 上位10件を取得
  const topResults = results.slice(0, 10);

  // ★ GA4に検索イベントを送信
  if (typeof gtag === "function") {
    gtag("event", "stock_search", {
      max_price: maxPrice,
      min_dividend: minDividend,
      max_per: maxPER,
      max_pbr: maxPBR,
      result_count: results.length
    });
  }

  // 結果描画
  let html = "";

  if (results.length === 0) {
    html = "<h4>検索結果：0 銘柄</h4><p>条件に一致する銘柄はありませんでした。</p>";
  } else {
    const displayCountText = results.length > 10 ? `（配当利回り上位 10 銘柄を表示）` : "";
    html += `<h4>検索結果：${results.length} 銘柄 ${displayCountText}</h4>`;

    html += `
      <table border="1" style="border-collapse: collapse; padding: 5px;">
        <thead>
          <tr>
            <th>順位</th>
            <th>コード</th>
            <th>銘柄</th>
            <th>株価</th>
            <th>利回り</th>
            <th>PER</th>
            <th>PBR</th>
          </tr>
        </thead>
        <tbody>
    `;

    topResults.forEach((stock, index) => {
      html += `
        <tr>
          <td style="text-align: center;">${index + 1}</td>
          <td>${stock.code}</td>
          <td>${stock.name}</td>
          <td style="text-align: right;">${stock.price.toLocaleString()}円</td>
          <td style="text-align: right;">${stock.dividend.toFixed(2)}%</td>
          <td style="text-align: right;">${stock.per.toFixed(2)}</td>
          <td style="text-align: right;">${stock.pbr.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;
  }

  document.getElementById("result").innerHTML = html;
}


// テーブルのモーダル
function openStockDetail(button) {

    const title = button.dataset.title;
    const detail = button.dataset.detail;

    const modal = document.getElementById("stock-detail-modal");

    document.getElementById("stock-detail-title").textContent = title;
    document.getElementById("stock-detail-content").innerHTML = detail;

    modal.classList.add("show");
}

function closeStockDetail() {

    const modal = document.getElementById("stock-detail-modal");

    modal.classList.remove("show");
}

document.addEventListener("click", function(event) {

    const modal = document.getElementById("stock-detail-modal");

    if (event.target === modal) {
        closeStockDetail();
    }

});