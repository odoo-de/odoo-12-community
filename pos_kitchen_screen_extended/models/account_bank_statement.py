# -*- coding: utf-8 -*-

from odoo import api, fields, models, _
from odoo.exceptions import UserError, ValidationError
from odoo.tools.misc import formatLang, format_date


class AccountBankStatement(models.Model):
    _inherit = "account.bank.statement"

    @api.multi
    def _balance_check(self):
        print("\n\n\n >>>>>>>>>>>>>>>>>>>>>>>>> _balance_check CALLLLLLLL")
        for stmt in self:
            if not stmt.currency_id.is_zero(stmt.difference):
                if stmt.journal_type == 'cash':
                    if stmt.difference < 0.0:
                        account = stmt.journal_id.loss_account_id
                        name = _('Loss')
                    else:
                        # statement.difference > 0.0
                        account = stmt.journal_id.profit_account_id
                        name = _('Profit')
                    if not account:
                        raise UserError(
                            _('There is no account defined on the journal %s for %s involved in a cash difference.') % (
                            stmt.journal_id.name, name))

                    values = {
                        'statement_id': stmt.id,
                        'account_id': account.id,
                        'amount': stmt.difference,
                        'name': _("Cash difference observed during the counting (%s)") % name,
                        'ref': _("Cash difference")
                    }
                    self.env['account.bank.statement.line'].create(values)
                else:
                    balance_end_real = formatLang(self.env, stmt.balance_end_real, currency_obj=stmt.currency_id)
                    balance_end = formatLang(self.env, stmt.balance_end, currency_obj=stmt.currency_id)
                    raise UserError(
                        _('The ending balance is incorrect !\nThe expected balance (%s) is different from the computed one. (%s)')
                        % (balance_end_real, balance_end))
        return True