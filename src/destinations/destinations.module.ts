import { Module } from '@nestjs/common';
import { AdminDestinationsController, DestinationsController } from './destinations.controller.js';
import { DestinationsService } from './destinations.service.js';

@Module({
  controllers: [DestinationsController, AdminDestinationsController],
  providers: [DestinationsService],
  exports: [DestinationsService],
})
export class DestinationsModule {}
