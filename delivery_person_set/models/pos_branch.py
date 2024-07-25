# -*- coding: utf-8 -*-
import logging
from odoo import api, models, fields, registry, _

_logger = logging.getLogger(__name__)


class PosBranch(models.Model):
    _inherit = "pos.branch"

    delivery_user_ids = fields.Many2many('res.users', 'pos_delivery_res_users_rel', 'branch_id', 'user_id',
                                         string='Delivery Person')


class pos_order(models.Model):
    _inherit = "pos.order"

    deliver_person = fields.Many2one('res.users')

    @api.multi
    def action_select_delivery_person(self):
        compose_form = self.env.ref('delivery_person_set.assign_team_from_view', False)
        ctx = dict(
            default_branch_id=self.pos_branch_id.id,
        )
        return {
            'name': _('Select Delivery'),
            'type': 'ir.actions.act_window',
            'view_type': 'form',
            'view_mode': 'form',
            'res_model': 'assign.team',
            'views': [(compose_form.id, 'form')],
            'view_id': compose_form.id,
            'target': 'new',
            'context': ctx,
        }
