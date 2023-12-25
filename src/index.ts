import { readFile } from 'fs/promises';
import internal from 'stream';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import { Context, Schema, Service } from 'koishi';

declare module 'koishi' {
    interface Context {
        'server.temp': TempService;
    }
}

export const name = 'server-temp-kook';

export interface Config {
    token: string;
}

export const Config: Schema<Config> = Schema.object({
    token: Schema.string().required().role('secret'),
});

export class TempService extends Service {
    protected token: string;

    constructor(ctx: Context, config: Config) {
        super(ctx, 'server.temp', true);
        this.token = config.token;
    }

    async create(data: Buffer | string | internal.Readable): Promise<{ url: string }> {
        if (typeof data === 'string') {
            if (new URL(data).protocol === 'file:') {
                data = await readFile(fileURLToPath(data));
            } else {
                data = await this.ctx.http.get(data, { responseType: 'stream' });
            }
        }
        const payload = new FormData();
        payload.append('file', data, { filename: 'image.jpg' });
        const result = await this.ctx.http.post('https://www.kookapp.cn/api/v3/asset/create', payload, { headers: { Authorization: `Bot ${this.token}` } });
        if (result.code === 0) {
            return { url: result.data.url };
        }
        throw new Error(result.message);
    }
}

export function apply(ctx: Context, config: Config) {
    ctx.plugin(TempService, config);
}
