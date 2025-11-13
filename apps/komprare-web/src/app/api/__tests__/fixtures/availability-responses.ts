/**
 * Mock IKEA Availability API responses
 * Matches the structure returned by https://api.ingka.ikea.com/cia/availabilities/ru/{country}
 */

/**
 * High stock availability (>10 items)
 */
export const highStockAvailability = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 25,
            probability: {
              thisDay: {
                messageType: 'HIGH_IN_STOCK',
                message: 'Ruim op voorraad',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Medium stock availability (5-10 items)
 */
export const mediumStockAvailability = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 7,
            probability: {
              thisDay: {
                messageType: 'MEDIUM_IN_STOCK',
                message: 'Beperkt op voorraad',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Low stock availability (1-4 items)
 */
export const lowStockAvailability = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 2,
            probability: {
              thisDay: {
                messageType: 'LOW_IN_STOCK',
                message: 'Laag op voorraad',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Out of stock with restock date
 */
export const outOfStockWithRestockDate = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 0,
            probability: {
              thisDay: {
                messageType: 'OUT_OF_STOCK',
                message: 'Momenteel niet op voorraad',
              },
            },
          },
          restocks: [
            {
              earliestDate: '2025-12-15',
              latestDate: '2025-12-20',
              quantity: 50,
            },
          ],
        },
      },
    },
  ],
};

/**
 * Out of stock without restock date
 */
export const outOfStockNoRestock = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 0,
            probability: {
              thisDay: {
                messageType: 'OUT_OF_STOCK',
                message: 'Momenteel niet op voorraad',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Availability without messageType (requires fallback calculation)
 */
export const availabilityWithoutMessageType = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 15,
            probability: {},
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Store not found in response (different store codes)
 */
export const storeNotFoundResponse = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '123', // Different store
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 10,
            probability: {
              thisDay: {
                messageType: 'HIGH_IN_STOCK',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Empty availabilities array
 */
export const emptyAvailabilities = {
  availabilities: [],
};

/**
 * Malformed response (missing required fields)
 */
export const malformedResponse = {
  someOtherField: 'value',
};

/**
 * Multiple stores in response (need to filter for specific store)
 */
export const multipleStoresResponse = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '123',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 5,
            probability: {
              thisDay: {
                messageType: 'MEDIUM_IN_STOCK',
              },
            },
          },
          restocks: [],
        },
      },
    },
    {
      classUnitKey: {
        classUnitCode: '085', // Target store
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 12,
            probability: {
              thisDay: {
                messageType: 'HIGH_IN_STOCK',
              },
            },
          },
          restocks: [],
        },
      },
    },
    {
      classUnitKey: {
        classUnitCode: '456',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 3,
            probability: {
              thisDay: {
                messageType: 'LOW_IN_STOCK',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};

/**
 * Response with multiple restock dates
 */
export const multipleRestockDates = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 0,
            probability: {
              thisDay: {
                messageType: 'OUT_OF_STOCK',
              },
            },
          },
          restocks: [
            {
              earliestDate: '2025-12-10',
              latestDate: '2025-12-12',
              quantity: 25,
            },
            {
              earliestDate: '2025-12-20',
              latestDate: '2025-12-25',
              quantity: 50,
            },
          ],
        },
      },
    },
  ],
};

/**
 * Invalid quantity format (string instead of number)
 */
export const invalidQuantityFormat = {
  availabilities: [
    {
      classUnitKey: {
        classUnitCode: '085',
        classUnitType: 'STO',
      },
      buyingOption: {
        cashCarry: {
          availability: {
            quantity: 'invalid',
            probability: {
              thisDay: {
                messageType: 'HIGH_IN_STOCK',
              },
            },
          },
          restocks: [],
        },
      },
    },
  ],
};
