"""The launcher's `/remote` mode machine (C07.01, C07.05).

`test_remote.mjs` owns the gateway itself; this owns which listeners the
launcher asks for, and what it tells the operator they got.
"""
from __future__ import annotations
import argparse
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))
from service import address_kind, remote_command, remote_paths


def invoke(root, action, value=None, capsys=None):
    """One `/remote <action>` with no live DSH, so no gateway is ever started."""
    args = argparse.Namespace(remote_action=action, value=value)
    remote_command(root, {'port': 3092}, args, None)
    return capsys.readouterr().out


def settings(root):
    return json.loads(remote_paths(root)[1].read_text())


def test_tunnel_serves_a_hostname_without_opening_the_lan(tmp_path, capsys):
    """A tunnel reaches DSH through 127.0.0.1, which is always bound.

    Before this mode, registering a tunnel hostname was useless unless the
    operator also ran `remote on` — paying a LAN listener for an off-LAN
    feature that never needed one.
    """
    invoke(tmp_path, 'add-host', 'harness.example.test', capsys)
    out = invoke(tmp_path, 'tunnel', capsys=capsys)
    assert settings(tmp_path)['mode'] == 'tunnel'
    assert '仅隧道' in out
    assert 'https://harness.example.test/?k=' in out
    # The whole point: no router-local address is offered in this mode.
    assert '局域网：' not in out and 'Tailscale：' not in out


def test_on_still_means_lan_and_tunnel_together(tmp_path, capsys):
    invoke(tmp_path, 'add-host', 'harness.example.test', capsys)
    out = invoke(tmp_path, 'on', capsys=capsys)
    assert settings(tmp_path)['mode'] == 'lan'
    assert '局域网 + 隧道' in out
    assert 'https://harness.example.test/?k=' in out


def test_a_hostname_registered_while_off_is_kept_and_said_so(tmp_path, capsys):
    """Silence here reads as "the registration was dropped"; it was not."""
    out = invoke(tmp_path, 'add-host', 'harness.example.test', capsys)
    assert settings(tmp_path)['hostnames'] == ['harness.example.test']
    assert 'harness.example.test' in out
    assert 'remote tunnel' in out


def test_the_tailscale_address_is_not_called_local(tmp_path):
    """100.64.0.0/10 is Tailscale's range: the one address that already works
    from anywhere. Labelling it 「局域网」 hid it among the ones that do not."""
    assert address_kind('100.120.8.98') == 'Tailscale'
    assert address_kind('100.64.0.1') == 'Tailscale'
    # Bounds: 100.0.x and 100.128.x are ordinary public space, not the CGNAT block.
    assert address_kind('100.63.255.1') == '局域网'
    assert address_kind('100.128.0.1') == '局域网'
    assert address_kind('192.168.1.7') == '局域网'


@pytest.mark.parametrize('value', ['https://harness.example.test', 'harness.example.test:8443', 'not a host'])
def test_add_host_takes_a_hostname_and_nothing_else(tmp_path, value, capsys):
    with pytest.raises(SystemExit):
        invoke(tmp_path, 'add-host', value, capsys)
