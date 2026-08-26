-- Oracle Page — 마감 자동 정산 스케줄
--
-- 그동안 정산은 브라우저가 열려 있을 때만 돌았다. 탭을 닫아두면 시간이 지나도
-- 결과가 확정되지 않았다. 여기서 서버가 대신 돌게 만든다.
--
-- pg_cron 은 Supabase 대시보드 > Database > Extensions 에서 켤 수 있다.
-- 켜져 있지 않으면 이 마이그레이션은 조용히 넘어가고, 앱은 기존처럼
-- 클라이언트에서 밀린 예언을 따라잡는다.

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema extensions;

    -- 같은 이름의 스케줄이 이미 있으면 지우고 다시 건다 (마이그레이션 재실행 대비)
    perform extensions.cron.unschedule('settle-due-oracles')
      where exists (
        select 1 from extensions.cron.job where jobname = 'settle-due-oracles'
      );

    perform extensions.cron.schedule(
      'settle-due-oracles',
      '* * * * *',                      -- 매분
      $cron$ select public.settle_due_oracles(); $cron$
    );

    raise notice 'pg_cron 스케줄 등록 완료: settle-due-oracles (매분)';
  else
    raise notice 'pg_cron 을 쓸 수 없어 자동 정산 스케줄을 건너뜁니다. '
                 '대시보드에서 확장을 켠 뒤 이 마이그레이션을 다시 실행하세요.';
  end if;
end;
$$;
