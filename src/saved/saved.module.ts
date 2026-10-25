import { Module } from '@nestjs/common';
import { DestinationsModule } from '../destinations/destinations.module.js';
import { SavedController } from './saved.controller.js';
import { SavedService } from './saved.service.js';

@Module({
  imports: [DestinationsModule],
  controllers: [SavedController],
  providers: [SavedService],
})
export class SavedModule {}
