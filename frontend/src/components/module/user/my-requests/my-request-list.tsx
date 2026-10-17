"use client";

import type { MyRequest } from "@/service/request.service";
import { setDialogParams } from "./dialog-params";
import { MyRequestCard } from "./my-request-card";

export function MyRequestsList({ requests }: { requests: MyRequest[] }) {
  return (
    <ul className="space-y-4">
      {requests.map((request) => (
        <li key={request.id}>
          <MyRequestCard
            request={request}
            onView={() => setDialogParams({ request: request.id })}
            onEdit={() =>
              setDialogParams({ edit: request.id, request: null, back: null })
            }
          />
        </li>
      ))}
    </ul>
  );
}
