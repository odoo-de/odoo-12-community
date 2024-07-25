# -*- coding: utf-8 -*-
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError


class pos_order(models.Model):
    _inherit = "pos.order"

    voucher_id = fields.Many2one('pos.voucher', 'Voucher Used')
    delivery_address_id = fields.Many2one('res.partner', string="Delivery Address")
    delivery_phone = fields.Char("Delivery Phone")
    delivery_date = fields.Datetime("Delivery Date")
    customer_feedback_ids = fields.One2many("customer.feedback", "pos_order_id", string="Customer Feedback")

    @api.model
    def _order_fields(self, ui_order):
        order_fields = super(pos_order, self)._order_fields(ui_order)
        if ui_order.get('pos_branch_id', False):
            order_fields.update({
                'pos_branch_id': ui_order['pos_branch_id'],
            })
            if ui_order.get('delivery_address'):
                order_fields.update({
                    'delivery_address_id': ui_order['delivery_address'],
                    'delivery_phone': ui_order['delivery_phone'],
                    'delivery_date': ui_order['delivery_date'],
                    'note': ui_order['note']
                })
        return order_fields


class CustomerFeedback(models.Model):
    _name = "customer.feedback"

    pos_order_id = fields.Many2one('pos.order', string="Order")
    feedback = fields.Text("Feedback")
    reason_for_call_id = fields.Many2one('reason.for.call', string="Reason For Call")

    @api.model
    def create_feedback_from_ui(self, vals):
        order_no = vals.get('order_no')
        order_no_validation = "Please provide Order Number."
        if not order_no:
            raise ValidationError(_(order_no_validation))
        pos_order_id = self.env['pos.order'].search(['|', ('name', '=', order_no), ('ean13', '=', order_no)])
        if not pos_order_id:
            raise ValidationError(_(order_no_validation))
        feedback = vals.get('feedback')
        self.create({
            'pos_order_id': pos_order_id.id,
            'feedback': feedback,
            'reason_for_call_id': vals.get('reason_for_call_id', False),
        })


class ReasonForCall(models.Model):
    _name = "reason.for.call"

    name = fields.Char("Reason For Call", required=True)

