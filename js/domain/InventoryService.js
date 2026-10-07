export class InventoryService {

    constructor(repository) {

        this.repository = repository;

        this.records =
            this.repository.getAll();
    }


    getAll() {

        return [...this.records];
    }

    replaceAll(records) {
        this.records = [...records];
    }

    findById(id) {

        return this.records.find(
            record => record.id === id
        );
    }


    search(query) {

        const normalizedQuery =
            this.normalize(query);

        if (!normalizedQuery) {
            return this.getAll();
        }

        return this.records.filter(record => {

            const code =
                this.normalize(record.code);

            const brand =
                this.normalize(record.carBrand);

            return (
                code.includes(normalizedQuery) ||
                brand.includes(normalizedQuery)
            );
        });
    }


    create(data) {

        const validatedData =
            this.validate(data);

        const record = {

            id: crypto.randomUUID(),

            code: validatedData.code,

            carBrand: validatedData.carBrand,

            price: validatedData.price,

            createdAt:
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString(),

            deleted: false
        };


        this.records.push(record);

        this.persist();

        return record;
    }


    update(id, data) {

        const record =
            this.findById(id);

        if (!record) {

            throw new Error(
                "El registro no existe."
            );
        }


        const validatedData =
            this.validate(data, id);


        Object.assign(
            record,
            validatedData,
            {
                updatedAt:
                    new Date().toISOString()
            }
        );


        this.persist();

        return record;
    }


    delete(id) {

        const record =
            this.findById(id);

        if (!record) {

            throw new Error(
                "El registro no existe."
            );
        }


        /*
         * No eliminamos físicamente el registro.
         *
         * Esto será importante para sincronización
         * entre dispositivos.
         */
        record.deleted = true;

        record.updatedAt =
            new Date().toISOString();


        this.persist();

        return record;
    }


    validate(data, editingId = null) {

        const code =
            String(data.code ?? "").trim();

        const carBrand =
            String(data.carBrand ?? "").trim();

        const price =
            Number(data.price);


        if (!code) {

            throw new Error(
                "El código es obligatorio."
            );
        }


        if (!carBrand) {

            throw new Error(
                "La marca del carro es obligatoria."
            );
        }


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            throw new Error(
                "El precio debe ser válido."
            );
        }


        const duplicated =
            this.records.some(record => {

                if (
                    record.id === editingId ||
                    record.deleted
                ) {
                    return false;
                }

                return (
                    this.normalize(record.code) ===
                    this.normalize(code)
                );
            });


        if (duplicated) {

            throw new Error(
                "Ya existe un producto con ese código."
            );
        }


        return {

            code,

            carBrand,

            price: Number(
                price.toFixed(2)
            )
        };
    }


    persist() {

        this.repository.saveAll(
            this.records
        );
    }


    normalize(value) {

        return String(value ?? "")
            .trim()
            .toLowerCase();
    }
}