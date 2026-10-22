// Entirely invented chat examples. No customer conversations were used.
function order(id, messages, customerName, items, total, date, payment = 'not_stated') {
  return {
    id, messages,
    expected: { orders: [{ customer_name: customerName,
      items: items.map(([name, quantity, unitPrice]) => ({ name, quantity, unit_price_php: unitPrice })),
      total_php: total, delivery_date: date, payment_status: payment }] },
  };
}

export const fixtures = [
  order('01-basic', ['Buyer: Hi! 2 banana loaves po at ₱180 each.', 'Seller: Yes, reserved for Oct 25, 2026.', 'Buyer: Thanks! - Ana'], 'Ana', [['banana loaf', 2, 180]], 360, '2026-10-25'),
  order('02-paid', ['Buyer: Ako si Bea. 1 chocolate cake, ₱650. Deliver Oct 26, 2026.', 'Seller: Payment received po, salamat!'], 'Bea', [['chocolate cake', 1, 650]], 650, '2026-10-26', 'paid'),
  order('03-unpaid', ['Buyer: Carlo here. 3 tubs of cookies at ₱120 each.', 'Seller: Sure, Oct 27, 2026 delivery. Payment pending pa po.'], 'Carlo', [['tub of cookies', 3, 120]], 360, '2026-10-27', 'unpaid'),
  order('04-no-price', ['Buyer: Hi, Dena po. Order ko 2 ube cupcakes.', 'Seller: Okay, Oct 28, 2026 delivery.'], 'Dena', [['ube cupcake', 2, null]], null, '2026-10-28'),
  order('05-no-quantity', ['Buyer: Ella here, pareserve ng mango float. ₱250 each.', 'Seller: Sige, Oct 29, 2026.'], 'Ella', [['mango float', null, 250]], null, '2026-10-29'),
  order('06-no-date', ['Buyer: Francis po. 4 cheese rolls at ₱45 each.', 'Seller: Confirmed!'], 'Francis', [['cheese roll', 4, 45]], 180, null),
  order('07-no-name', ['Buyer: 2 jars of chili garlic po, ₱160 each.', 'Seller: Okay for Oct 30, 2026.'], null, [['jar of chili garlic', 2, 160]], 320, '2026-10-30'),
  order('08-total-only', ['Buyer: Gina po. Isang party tray pancit, total ₱900.', 'Seller: Noted, Nov 1, 2026.'], 'Gina', [['party tray pancit', 1, null]], 900, '2026-11-01'),
  order('09-correction-quantity', ['Buyer: Hanna po. 2 boxes brownies at ₱300/box.', 'Buyer: Ay 3 boxes pala. Nov 2, 2026 delivery.', 'Seller: Updated to 3 boxes po.'], 'Hanna', [['box of brownies', 3, 300]], 900, '2026-11-02'),
  order('10-correction-item', ['Buyer: Ivan here. 1 strawberry cake ₱700.', 'Buyer: Change to chocolate cake same price please. Nov 3, 2026.', 'Seller: Yes po.'], 'Ivan', [['chocolate cake', 1, 700]], 700, '2026-11-03'),
  order('11-two-items', ['Buyer: Joy po. 2 leche flan ₱150 each at 1 cassava cake ₱280.', 'Seller: Got it, Nov 4, 2026.', 'Buyer: Fully paid na via transfer.'], 'Joy', [['leche flan', 2, 150], ['cassava cake', 1, 280]], 580, '2026-11-04', 'paid'),
  order('12-two-items-partial-price', ['Buyer: Kai po. 1 buko pie ₱350 and 2 ensaymada.', 'Seller: Sige for Nov 5, 2026.'], 'Kai', [['buko pie', 1, 350], ['ensaymada', 2, null]], null, '2026-11-05'),
  order('13-payment-promise', ['Buyer: Lia po, 2 boxes polvoron ₱200 each. Pay ko tomorrow.', 'Seller: Sige, delivery Nov 6, 2026.'], 'Lia', [['box of polvoron', 2, 200]], 400, '2026-11-06', 'unpaid'),
  order('14-payment-proof', ['Buyer: Mark po. 1 bilao palabok ₱850, Nov 7, 2026.', 'Buyer: Sent ₱850 via GCash.', 'Seller: Received, thank you!'], 'Mark', [['bilao palabok', 1, 850]], 850, '2026-11-07', 'paid'),
  order('15-deposit-only', ['Buyer: Nina po. 1 customized mug ₱300 for Nov 8, 2026.', 'Buyer: Sent ₱100 deposit, balance sa pickup.', 'Seller: Received deposit.'], 'Nina', [['customized mug', 1, 300]], 300, '2026-11-08', 'unpaid'),
  order('16-date-correction', ['Buyer: Omar po, 2 bottled cold brew ₱95 each. Nov 9, 2026.', 'Buyer: Can we move to Nov 10, 2026?', 'Seller: Yes, Nov 10 confirmed.'], 'Omar', [['bottled cold brew', 2, 95]], 190, '2026-11-10'),
  order('17-same-as-last-time', ['Buyer: Pia po. Same as last time please, Nov 11, 2026.', 'Seller: Okay, noted.'], 'Pia', [], null, '2026-11-11'),
  order('18-no-date-ambiguous', ['Buyer: Quin po. 1 bucket fried chicken ₱499.', 'Buyer: Maybe next week ang delivery.', 'Seller: Order noted.'], 'Quin', [['bucket fried chicken', 1, 499]], 499, null),
  order('19-price-correction', ['Buyer: Rosa po. 2 packs of siomai, ₱100/pack.', 'Seller: New price ₱110/pack po, okay?', 'Buyer: Yes, 2 packs at ₱110. Nov 12, 2026.'], 'Rosa', [['pack of siomai', 2, 110]], 220, '2026-11-12'),
  order('20-name-correction', ['Buyer: This is Sam ordering 1 bouquet ₱600.', 'Buyer: Please write my name as Samantha. Nov 13, 2026.', 'Seller: Sige Samantha.'], 'Samantha', [['bouquet', 1, 600]], 600, '2026-11-13'),
  order('21-free-item', ['Buyer: Tina po. 2 tubs ice cream ₱180 each plus 1 free sticker.', 'Seller: Confirmed, Nov 14, 2026.'], 'Tina', [['tub of ice cream', 2, 180], ['sticker', 1, 0]], 360, '2026-11-14'),
  order('22-discount-total', ['Buyer: Uri po, 2 tote bags at ₱250 each.', 'Seller: With discount, total ₱450. Nov 15, 2026 okay?', 'Buyer: Yes po.'], 'Uri', [['tote bag', 2, 250]], 450, '2026-11-15'),
  order('23-mixed-language', ['Buyer: Vina here. Pa-order po ng three mini pizzas, ₱120 each.', 'Seller: Sure! Nov 16, 2026 delivery.'], 'Vina', [['mini pizza', 3, 120]], 360, '2026-11-16'),
  order('24-late-paid-update', ['Buyer: Will po. 1 fruit basket ₱780, Nov 17, 2026.', 'Seller: Pending payment po.', 'Buyer: Paid na.', 'Seller: Confirmed received ₱780.'], 'Will', [['fruit basket', 1, 780]], 780, '2026-11-17', 'paid'),
  order('25-partial-price-no-total', ['Buyer: Xena po. 2 candles ₱90 each and 1 soap.', 'Seller: Sige, Nov 18, 2026.'], 'Xena', [['candle', 2, 90], ['soap', 1, null]], null, '2026-11-18'),
  order('26-quantity-cancel', ['Buyer: Yani po. 3 milk teas at ₱120 each.', 'Buyer: Cancel one, 2 na lang. Nov 19, 2026.', 'Seller: 2 milk teas reserved.'], 'Yani', [['milk tea', 2, 120]], 240, '2026-11-19'),
  order('27-unpriced', ['Buyer: Zoe po, 1 crochet pouch for Nov 20, 2026.', 'Seller: Sure, payment after quote.'], 'Zoe', [['crochet pouch', 1, null]], null, '2026-11-20', 'unpaid'),
  order('28-bundle', ['Buyer: Abby po. 1 snack bundle for ₱399, Nov 21, 2026.', 'Seller: Order confirmed.'], 'Abby', [['snack bundle', 1, 399]], 399, '2026-11-21'),
  order('29-price-not-agreed', ['Buyer: Ben po. Pa-order 2 potted plants.', 'Seller: Around ₱200 each siguro, final price later. Nov 22, 2026.', 'Buyer: Sige reserve muna.'], 'Ben', [['potted plant', 2, null]], null, '2026-11-22'),
  order('30-no-payment-guess', ['Buyer: Cara po. 4 packs graham balls at ₱75 per pack. Nov 23, 2026.', 'Seller: Okay, reserved.'], 'Cara', [['pack of graham balls', 4, 75]], 300, '2026-11-23'),
];
