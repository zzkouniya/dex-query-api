import { Server, Socket } from 'socket.io';
import http from "http";
import { container, modules } from '../ioc';
import IndexerWrapper from '../modules/indexer/indexer';
import { QueryOptions } from 'winston';

export class EventContext {
    private static io: Server;
  
    static init(httpServer: http.Server): void {
      const io = new Server(httpServer);
      this.io = io;
      EventContext.connection();
    }
  
    static connection(): void {
      const indexer: IndexerWrapper = container.get(modules[IndexerWrapper.name]);
      this.io.on('connection', function(socket: Socket) {
        socket.on('dex-event', function(msg) {
          try {
            const event = new CkbBalanceEvent(indexer, JSON.parse(msg), socket)
            event.subscribe();
          } catch (error) {
            console.error(error);
          }
  
        });  
      });
  
    }
  
}

export interface DexEvent {
    subscribe(): Promise<void>;
}


export class CkbBalanceEvent implements DexEvent {
    private indexer: IndexerWrapper; 
    private eventKey: QueryOptions;
    private socket: Socket;
  
    constructor(
      indexer: IndexerWrapper,
      eventKey: QueryOptions,
      socket: Socket,
    ) {
      this.indexer = indexer;
      this.eventKey = eventKey;
      this.socket = socket;
    }

    async subscribe(): Promise<void> {
      this.indexer.subscribe(this.eventKey, () => {
        const blockNumber = this.indexer.tip();
        this.socket.emit("dex-event", blockNumber);  
      });
    }
  
}