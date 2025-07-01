const products = [];

function renderTable() {
  const body = document.getElementById("inventory-body");
  body.innerHTML = "";

  getSortedProducts().forEach((product, index) => {
    const row = document.createElement("tr");

    if (product.stock === 0) {
      row.style.backgroundColor = "#ffcccc";
    }

    row.innerHTML = `
      <td>${product.name}</td>
      <td>${product.price}</td>
      <td>${product.stock}</td>
      <td>${product.sold}</td>
      <td>${product.price * product.sold}</td>
      <td>
        <button onclick="sellItem(${index})">売る</button>
        <button onclick="addStock(${index})">補充</button>
        <button onclick="returnItem(${index})">返却</button>
        <button onclick="deleteItem(${index})">削除</button><br>
        <button onclick="moveUp(${index})">↑</button>
        <button onclick="moveDown(${index})">↓</button>
      </td>
    `;
    body.appendChild(row);
  });

  updateTotalSales();
}

function saveData() {
  const db = window.firebaseDB;
  const ref = window.firebaseRef(db, 'inventory/products');
  window.firebaseSet(ref, products);
}

function loadInitialData() {
  const db = window.firebaseDB;
  const ref = window.firebaseRef(db, 'inventory/products');

  window.firebaseOnValue(ref, (snapshot) => {
    const data = snapshot.val();
    if (data && Array.isArray(data)) {
      products.length = 0;
      products.push(...data);
      renderTable();
    } else {
      console.warn("クラウドに商品データがありません");
    }
  });
}

function getSortedProducts() {
  return products.slice().sort((a, b) => a.order - b.order);
}

function addProduct() {
  const name = document.getElementById("nameInput").value;
  const price = parseInt(document.getElementById("priceInput").value);
  const stock = parseInt(document.getElementById("stockInput").value);

  if (!name || isNaN(price) || isNaN(stock)) {
    alert("すべての項目を正しく入力してください");
    return;
  }

  const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.order)) : 0;

  products.push({
    name,
    price,
    stock,
    sold: 0,
    order: maxOrder + 1
  });

  document.getElementById("nameInput").value = "";
  document.getElementById("priceInput").value = "";
  document.getElementById("stockInput").value = "";

  saveData();
}

function sellItem(index) {
  const product = getSortedProducts()[index];
  if (product.stock > 0) {
    product.stock--;
    product.sold++;
    saveData();
  } else {
    alert(`${product.name} の在庫がありません`);
  }
}

function addStock(index) {
  const product = getSortedProducts()[index];
  const amount = prompt(`${product.name} に何個補充しますか？`);
  const num = parseInt(amount);
  if (!isNaN(num) && num > 0) {
    product.stock += num;
    saveData();
    renderTable(); // ⬅️ 追加：補充後すぐに表示を更新
  } else {
    alert("正しい数値を入力してください");
  }
}

function returnItem(index) {
  const product = getSortedProducts()[index];
  if (product.stock > 0) {
    product.stock--;
    saveData();
  } else {
    alert(`${product.name} の在庫はもうありません`);
  }
}

function deleteItem(index) {
  const product = getSortedProducts()[index];
  const pos = products.findIndex(p => p === product);
  const ok = confirm(`${product.name} を削除しますか？`);
  if (ok) {
    products.splice(pos, 1);
    saveData();
  }
}

function moveUp(index) {
  const sorted = getSortedProducts();
  if (index === 0) return;
  const above = sorted[index - 1];
  const current = sorted[index];
  [above.order, current.order] = [current.order, above.order];
  saveData();
}

function moveDown(index) {
  const sorted = getSortedProducts();
  if (index >= sorted.length - 1) return;
  const below = sorted[index + 1];
  const current = sorted[index];
  [below.order, current.order] = [current.order, below.order];
  saveData();
}

function updateTotalSales() {
  let totalAmount = 0;
  let totalItems = 0;

  products.forEach(product => {
    totalAmount += product.price * product.sold;
    totalItems += product.sold;
  });

  document.getElementById("totalSalesDisplay").textContent =
    `売上合計金額：${totalAmount.toLocaleString()} 円｜売上個数：${totalItems.toLocaleString()} 個`;
}

window.addEventListener("DOMContentLoaded", () => {
  loadInitialData();
});

