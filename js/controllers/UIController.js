export class UIController {
    constructor(inventoryService, syncManager) {
        this.inventoryService = inventoryService;
        this.syncManager = syncManager;

        this.form = document.querySelector("#inventoryForm");
        this.searchInput = document.querySelector("#searchInput");
        this.inventoryBody = document.querySelector("#inventoryBody");

        this.codeInput = document.querySelector("#code");
        this.carBrandInput = document.querySelector("#carBrand");
        this.priceInput = document.querySelector("#price");

        this.formTitle = document.querySelector("#formTitle");
        this.saveButton = document.querySelector("#saveButton");
        this.cancelButton = document.querySelector("#cancelButton");
        this.syncStatus = document.querySelector("#syncStatus");
        this.inventoryCount = document.querySelector("#inventoryCount");

        this.editingId = null;
    }

    initialize() {
        this.bindEvents();
        this.render();
    }

    bindEvents() {
        this.form.addEventListener(
            "submit",
            event => this.handleSubmit(event)
        );

        this.cancelButton.addEventListener(
            "click",
            () => this.cancelEdit()
        );

        this.searchInput.addEventListener(
            "input",
            () => this.render()
        );

        this.inventoryBody.addEventListener(
            "click",
            event => this.handleTableClick(event)
        );
    }

    async handleSubmit(event) {
        event.preventDefault();

        const data = {
            code: this.codeInput.value,
            carBrand: this.carBrandInput.value,
            price: this.priceInput.value
        };

        try {
            if (this.editingId) {
                this.inventoryService.update(
                    this.editingId,
                    data
                );

                this.showSyncStatus(
                    "Actualizado localmente. Sincronizando...",
                    "success"
                );
            } else {
                this.inventoryService.create(data);

                this.showSyncStatus(
                    "Guardado localmente. Sincronizando...",
                    "success"
                );
            }

            this.resetForm();
            this.render();

            // La sincronización ocurre después de la mutación.
            const result =
                await this.syncManager.syncAfterMutation();

            if (result.synchronized) {
                this.showSyncStatus(
                    "Sincronizado correctamente.",
                    "success"
                );
            } else if (result.reason === "offline") {
                this.showSyncStatus(
                    "Guardado localmente. Sin conexión.",
                    "warning"
                );
            } else {
                this.showSyncStatus(
                    "Guardado localmente. Error al sincronizar.",
                    "error"
                );
            }

        } catch (error) {
            this.showError(error.message);
        }
    }

    handleTableClick(event) {
        const button = event.target.closest("button");

        if (!button) return;

        const id = button.dataset.id;

        if (button.classList.contains("edit-btn")) {
            this.startEdit(id);
        }

        if (button.classList.contains("delete-btn")) {
            this.handleDelete(id);
        }
    }

    startEdit(id) {
        const record =
            this.inventoryService.findById(id);

        if (!record || record.deleted) {
            this.showError("El registro no existe.");
            return;
        }

        this.editingId = id;

        this.codeInput.value = record.code;
        this.carBrandInput.value = record.carBrand;
        this.priceInput.value = record.price;

        this.formTitle.textContent = "Editar producto";
        this.saveButton.textContent = "Actualizar";
        this.cancelButton.hidden = false;

        this.codeInput.focus();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    async handleDelete(id) {
        const record =
            this.inventoryService.findById(id);

        if (!record || record.deleted) {
            this.showError("El registro no existe.");
            return;
        }

        const confirmed = window.confirm(
            `¿Seguro que deseas eliminar "${record.code}"?`
        );

        if (!confirmed) return;

        try {
            this.inventoryService.delete(id);

            if (this.editingId === id) {
                this.resetForm();
            }

            this.render();

            this.showSyncStatus(
                "Eliminado localmente. Sincronizando...",
                "success"
            );

            const result =
                await this.syncManager.syncAfterMutation();

            if (result.synchronized) {
                this.showSyncStatus(
                    "Eliminado y sincronizado correctamente.",
                    "success"
                );
            } else if (result.reason === "offline") {
                this.showSyncStatus(
                    "Eliminado localmente. Sin conexión.",
                    "warning"
                );
            } else {
                this.showSyncStatus(
                    "Eliminado localmente. Error al sincronizar.",
                    "error"
                );
            }

        } catch (error) {
            this.showError(error.message);
        }
    }

    cancelEdit() {
        this.resetForm();
    }

    resetForm() {
        this.editingId = null;

        this.form.reset();

        this.formTitle.textContent = "Agregar producto";
        this.saveButton.textContent = "Guardar";
        this.cancelButton.hidden = true;
    }

    render() {
        const query = this.searchInput.value;

        const records =
            this.inventoryService
                .search(query)
                .filter(record => !record.deleted);

        this.inventoryCount.textContent =
            `${records.length} ${
                records.length === 1
                    ? "registro"
                    : "registros"
            }`;

        if (records.length === 0) {
            this.inventoryBody.innerHTML = `
                <tr>
                    <td colspan="4" class="empty">
                        No hay registros.
                    </td>
                </tr>
            `;

            return;
        }

        this.inventoryBody.innerHTML =
            records.map(record => `
                <tr>
                    <td>${this.escape(record.code)}</td>

                    <td>
                        ${this.escape(record.carBrand)}
                    </td>

                    <td class="price">
                        S/ ${Number(record.price).toFixed(2)}
                    </td>

                    <td>
                        <div class="row-actions">

                            <button
                                type="button"
                                class="small-btn edit-btn"
                                data-id="${record.id}"
                            >
                                Editar
                            </button>

                            <button
                                type="button"
                                class="small-btn delete-btn"
                                data-id="${record.id}"
                            >
                                Eliminar
                            </button>

                        </div>
                    </td>
                </tr>
            `).join("");
    }

    showSyncStatus(message, type = "") {
        this.syncStatus.textContent = message;

        this.syncStatus.className =
            "sync-status";

        if (type) {
            this.syncStatus.classList.add(type);
        }
    }

    showError(message) {
        this.showSyncStatus(message, "error");
        console.error(message);
        alert(message);
    }

    escape(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }
}