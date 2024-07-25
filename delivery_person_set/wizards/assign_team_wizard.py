# -*- coding: utf-8 -*-
import pytz
from odoo import api, fields, models, _
from odoo.exceptions import Warning, UserError
from odoo.fields import datetime


class AssignTeam(models.TransientModel):
    _name = 'assign.team'
    _description = 'assign.team'

    user_id = fields.Many2one("res.users", string="User")
    branch_id = fields.Many2one("pos.branch", string="Branch")
    branch_select_user_ids = fields.Many2many("res.users", related='branch_id.delivery_user_ids')

    def action_set_user(self):
        if self.user_id:
            pos_order_id = self.env['pos.order'].browse(
                self.env.context.get('active_ids', []))
            pos_order_id.deliver_person = self.user_id