import { AuthUser } from "common/types/common.types";
import { createDealRequestDTO } from "./Deal.types";
import { DealRepository } from "./Deal.repository";

interface SplitPayload {
  participantId: string
  agreedValue: number
  cycleAmount?: number | null
  label: string
}
export const DealService = {
  async create(dto: createDealRequestDTO, user: AuthUser) {
    // console.log("dto", dto);
    const today = new Date();

    // Ensure nextPaymentDate is not in the past for recurring deals
    const nextPaymentDate =
      dto.nextPaymentDate && dto.nextPaymentDate > today
        ? dto.nextPaymentDate
        : today;

    const payload = {
      title: dto.title,
      dealType: dto.dealType,
      status: dto.status,

      // ownership
      userOwnerId: user.id,
      orgOwnerId: dto.orgOwnerId ?? null,

      // counterparty (flat — matches DB columns)
      counterPartyName: dto.counterparty.name,
      counterPartyEmail: dto.counterparty.email,
      counterPartyType: dto.counterparty.type,
      counterPartyContactPhone: dto.counterparty.contactPhone ?? null,

      // chain
      parentDealId: dto.parentDealId ?? null,

      // financials
      currency: dto.currency,
      agreedValue: dto.agreedValue,
      cycleAmount: dto.isRecurring ? (dto.cycleAmount ?? null) : null,

      // schedule
      isRecurring: dto.isRecurring,
      recurrenceInterval: dto.isRecurring ? (dto.recurrenceInterval ?? null) : null,
      nextPaymentDate: dto.isRecurring ? nextPaymentDate : null,

      // dates
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,

      // notes
      notes: dto.notes ?? null,

      // audit
      createdBy: user.id,
    }

    return DealRepository.createDeal(payload);
  },
  async getAll(user: AuthUser) {
    console.log("user", user);
    if (!user.id) {
      throw new Error("User ID is required");
    }
    return DealRepository.getAll(user.id);
  },
  async getById(id: string, user: AuthUser) {
    console.log("user", user);
    if (!user.id) {
      throw new Error("User ID is required");
    }
    return DealRepository.getById(id);
  },
  async createSplit(id: string, dto: any, user: AuthUser) {
    console.log("dto", dto);
    console.log("id", id);

    const parentDealId = id;
    const splitPayload: SplitPayload = {
      participantId: dto.participantId,
      label: dto.label,
      agreedValue: dto.agreedValue,
      cycleAmount: dto.cycleAmount,

    }
    return DealRepository.createSplit(parentDealId, splitPayload);
  },
  async getSplits(id: string, user: AuthUser) {
    console.log("user", user);
    if (!user.id) {
      throw new Error("User ID is required");
    }
    return DealRepository.getSplits(id);
  }
};
