import { StorageRepository }
    from "./repositories/StorageRepository.js";

import { CloudSyncService }
    from "./services/CloudSyncService.js";

import { InventoryService }
    from "./domain/InventoryService.js";

import { SyncManager }
    from "./services/SyncManager.js";

import { UIController }
    from "./controllers/UIController.js";


const GOOGLE_APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbzLba7t050566mt8u6oV_YVRHjs3jE2G9KooXOfdr_ZxMqZ_votug9fNZJnz3bPwh5nog/exec";


const repository =
    new StorageRepository(window.localStorage);

const cloudSyncService =
    new CloudSyncService(GOOGLE_APPS_SCRIPT_URL);

const inventoryService =
    new InventoryService(repository);

const syncManager =
    new SyncManager(
        repository,
        cloudSyncService
    );

const uiController =
    new UIController(
        inventoryService,
        syncManager
    );


uiController.initialize();


// Al abrir o refrescar la aplicación,
// intentamos obtener los datos más recientes.
syncManager.initialSync()
    .then(result => {

        if (!result.synchronized) {
            return;
        }

        inventoryService.replaceAll(
            result.records
        );

        uiController.render();
    });