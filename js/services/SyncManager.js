export class SyncManager {

    constructor(
        repository,
        cloudSyncService
    ) {

        this.repository =
            repository;

        this.cloudSyncService =
            cloudSyncService;
    }


    async initialSync() {

        /*
         * Si no hay conexión, simplemente
         * usamos el almacenamiento local.
         */
        if (!navigator.onLine) {

            return {
                synchronized: false,
                reason: "offline"
            };
        }


        try {

            const remoteRecords =
                await this
                    .cloudSyncService
                    .getRemoteRecords();


            const localRecords =
                this.repository.getAll();


            const mergedRecords =
                this.merge(
                    localRecords,
                    remoteRecords
                );


            this.repository.saveAll(
                mergedRecords
            );


            return {
                synchronized: true,
                records: mergedRecords
            };


        } catch (error) {

            console.warn(
                "Initial sync failed:",
                error
            );


            return {
                synchronized: false,
                reason: "error",
                error
            };
        }
    }


    async syncAfterMutation() {

        if (!navigator.onLine) {

            return {
                synchronized: false,
                reason: "offline"
            };
        }


        try {

            const localRecords =
                this.repository.getAll();


            await this
                .cloudSyncService
                .sync(localRecords);


            return {
                synchronized: true
            };


        } catch (error) {

            console.warn(
                "Cloud synchronization failed:",
                error
            );


            return {
                synchronized: false,
                reason: "error",
                error
            };
        }
    }


    merge(localRecords, remoteRecords) {

        const map =
            new Map();


        /*
         * Primero agregamos los datos locales.
         */
        for (const record of localRecords) {

            map.set(
                record.id,
                record
            );
        }


        /*
         * Después analizamos los remotos.
         */
        for (const remote of remoteRecords) {

            const local =
                map.get(remote.id);


            if (!local) {

                map.set(
                    remote.id,
                    remote
                );

                continue;
            }


            const localDate =
                new Date(
                    local.updatedAt
                ).getTime();


            const remoteDate =
                new Date(
                    remote.updatedAt
                ).getTime();


            /*
             * Last Write Wins.
             *
             * La versión más reciente gana.
             */
            if (remoteDate > localDate) {

                map.set(
                    remote.id,
                    remote
                );
            }
        }


        return [...map.values()];
    }
}