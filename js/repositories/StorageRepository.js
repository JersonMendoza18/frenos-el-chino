import { InventoryRepository } from "./InventoryRepository.js";

export class StorageRepository extends InventoryRepository {

    constructor(storage, storageKey = "brake-pads-inventory") {
        super();

        this.storage = storage;
        this.storageKey = storageKey;
    }

    getAll() {

        const data =
            this.storage.getItem(this.storageKey);

        if (!data) {
            return [];
        }

        try {

            const records = JSON.parse(data);

            return Array.isArray(records)
                ? records
                : [];

        } catch (error) {

            console.error(
                "Error parsing inventory:",
                error
            );

            return [];
        }
    }

    saveAll(records) {

        this.storage.setItem(
            this.storageKey,
            JSON.stringify(records)
        );
    }
}