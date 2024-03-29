import type { BeforeFindInput } from "@thothom/core/lib/repository/methods/find/before";
import { getTypeof, unnest } from "@techmmunity/utils";
import type { SortDirection } from "mongodb";

import { getArrayWhere } from "../../utils/get-array-where";

import type { Context } from "../../types/context";

export const find = async <Entity>(
	context: Context<Entity>, // Cannot destruct this!!!
	{ conditions: rawConditions, options: rawOptions }: BeforeFindInput<Entity>,
) => {
	const { conditions } = context.beforeFind({
		conditions: rawConditions,
		options: rawOptions,
	});

	const where = getArrayWhere(conditions.where);

	const query = {
		$or: where,
	};

	context.logger.debug(query);

	const command = context.table.find(query);

	if (getTypeof(conditions.skip) !== "undefined") {
		command.skip(conditions.skip!);
	}

	if (getTypeof(conditions.take) !== "undefined") {
		command.limit(conditions.take!);
	}

	if (getTypeof(conditions.order)) {
		const order: Record<string, SortDirection> = Object.fromEntries(
			Object.entries(unnest(conditions.order)).map(([key, value]) => [
				key,
				// eslint-disable-next-line @typescript-eslint/no-magic-numbers
				value.toLowerCase(),
			]),
		);

		command.sort(order);
	}

	const result = await command.toArray();

	return {
		data: context.afterFind({
			conditions: rawConditions,
			dataToReturn: result,
			options: rawOptions,
		}),
	};
};
