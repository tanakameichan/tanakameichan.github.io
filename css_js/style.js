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