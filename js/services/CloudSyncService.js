export class CloudSyncService {

    constructor(endpoint) {

        this.endpoint = endpoint;
    }


    isConfigured() {

        return Boolean(this.endpoint);
    }


    async getRemoteRecords() {

        if (!this.isConfigured()) {

            throw new Error(
                "Google Apps Script no está configurado."
            );
        }


        const url =
            `${this.endpoint}?action=GET`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Error HTTP ${response.status}`
            );
        }


        const data =
            await response.json();


        if (!data.success) {

            throw new Error(
                data.message ||
                "Error obteniendo datos remotos."
            );
        }


        return data.records ?? [];
    }


    async sync(records) {

        if (!this.isConfigured()) {

            throw new Error(
                "Google Apps Script no está configurado."
            );
        }


        await fetch(this.endpoint, {

            method: "POST",

            mode: "no-cors",

            headers: {
                "Content-Type":
                    "text/plain;charset=utf-8"
            },

            body: JSON.stringify({

                action: "SYNC",

                records

            })
        });
    }
}