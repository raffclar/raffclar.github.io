---
layout: single
classes: wide
title:  "Black & White PC Mesh NamedData struct"
date:   2021-01-03 02:00:00 +0100
categories: cpp games
---

LH NameData, UV2Data, FootprintData size function.

```c
ulonglong .GetSizeNameData__8LH3DMeshFv(int param_1)

{
  int iVar2;
  int iVar3;
  ulonglong uVar1;
  
  // mesh->flags.ContainsNameData == 0
  if ((*(uint *)(param_1 + 4) & 0x80000) == 0) {
    uVar1 = 0;
  }
  else {
    // mesh->flags.ContainsNameData == 0
    iVar2 = .IsContainsNameData__8LH3DMeshFv();
    if (iVar2 == 0) {
      uVar1._4_4_ = (uint *)0x0; // No data, return 0
    }
    else {
      // UV2Size + FootprintSize + 72 bytes
      iVar2 = .GetSizeUV2Data__8LH3DMeshFv(param_1);
      iVar3 = .GetSizeFootprintData__8LH3DMeshFv(param_1);
      uVar1._4_4_ = (uint *)(*(int *)(param_1 + 0x48) + iVar3 + iVar2);
    }
    uVar1 = (ulonglong)*uVar1._4_4_;
  }
  return uVar1;
}
```

Now for `.GetSizeUV2Data__8LH3DMeshFv`. Very similar to the above
```c

ulonglong .GetSizeUV2Data__8LH3DMeshFv(int param_1)

{
  int iVar2;
  ulonglong uVar1;
  
  // mesh->flags.ContainsUV2 == 0
  if ((*(uint *)(param_1 + 4) & 0x40000) == 0) {
    uVar1 = 0;
  }
  else {
    iVar2 = .IsContainsUV2__8LH3DMeshFv();
    if (iVar2 == 0) {
      uVar1._4_4_ = (uint *)0x0; // No data, return 0
    }
    else {
	  // FootprintSize + 72 bytes
      iVar2 = .GetSizeFootprintData__8LH3DMeshFv(param_1);
      uVar1._4_4_ = (uint *)(*(int *)(param_1 + 0x48) + iVar2);
    }
    uVar1 = (ulonglong)*uVar1._4_4_;
  }
  return uVar1;
}
```

Now for `.GetSizeFootprintData__8LH3DMeshFv`. Also very similar

```c
ulonglong .GetSizeFootprintData__8LH3DMeshFv(int param_1)

{
  int iVar2;
  ulonglong uVar1;
  
  // mesh->flags.ContainsLandscapeFeature
  if ((*(uint *)(param_1 + 4) & 0x8000) == 0) {
    uVar1 = 0;  // No data, return 0
  }
  else {
    iVar2 = .IsContainsLandscapeFeature__8LH3DMeshFv();
    if (iVar2 == 0) {
      iVar2 = 0; // Dead code. Branch never taken
    }
    else {
      iVar2 = *(int *)(param_1 + 0x48);
    }
	// If mesh has a landscape feature then go to offset 72 + 8
	// otherwise offset 8
    uVar1 = (ulonglong)*(uint *)(iVar2 + 8);
  }
  return uVar1;
}
```

0x48/72 bytes skipped when the `ContainsLandscapeFeature` flag is present. Add another 8 bytes to get 80. This makes us skip 20 DWORDs.



```
void .DrawNameScrolls__10TempleRoomFiiiPPwPA3_Ulff(undefined8 param_1,double param_2,undefined8 param_3,int param_4,int param_5,int param_6,longlong param_7)
{
  int *piVar1;
  undefined4 *puVar2;
  undefined *puVar3;
  undefined **ppuVar4;
  int iVar6;
  int iVar7;
  int iVar8;
  undefined8 uVar5;
  int iVar9;
  undefined8 unaff_r14;
  undefined8 unaff_r15;
  undefined8 unaff_r16;
  undefined8 unaff_r17;
  undefined8 unaff_r18;
  undefined8 unaff_r19;
  undefined8 unaff_r20;
  undefined8 unaff_r21;
  undefined8 unaff_r22;
  undefined8 unaff_r23;
  undefined8 unaff_r24;
  undefined8 unaff_r25;
  undefined8 unaff_r26;
  int iVar10;
  undefined8 unaff_r27;
  ulonglong uVar11;
  undefined8 unaff_r28;
  undefined8 unaff_r29;
  undefined8 unaff_r30;
  undefined8 unaff_r31;
  ulonglong uVar12;
  double extraout_f1;
  double dVar13;
  double dVar14;
  double dVar15;
  double dVar16;
  double dVar17;
  int local_11c;
  undefined auStack208 [12];
  float local_c4;
  float local_c0;
  float local_bc;
  float local_b8;
  float local_b4;
  float local_b0;
  float local_ac;
  float local_a8;
  float local_a4;
  float local_a0;
  float local_9c;
  float local_98;
  float local_94;
  float local_90;
  float local_8c;
  longlong local_88;
  undefined4 local_80;
  uint uStack124;
  undefined4 local_78;
  undefined4 uStack116;
  undefined4 uStack112;
  undefined4 uStack108;
  undefined4 uStack104;
  undefined4 uStack100;
  undefined4 uStack96;
  undefined4 uStack92;
  undefined4 uStack88;
  undefined4 uStack84;
  undefined4 uStack80;
  undefined4 uStack76;
  undefined4 uStack72;
  undefined4 uStack68;
  undefined4 uStack64;
  undefined4 uStack60;
  undefined4 uStack56;
  undefined4 uStack52;
  
  ppuVar4 = &toc;
  iVar6 = FUN_1061a870();
  local_78 = (undefined4)((ulonglong)unaff_r14 >> 0x20);
  uStack116 = (undefined4)((ulonglong)unaff_r15 >> 0x20);
  uStack112 = (undefined4)((ulonglong)unaff_r16 >> 0x20);
  uStack108 = (undefined4)((ulonglong)unaff_r17 >> 0x20);
  uStack104 = (undefined4)((ulonglong)unaff_r18 >> 0x20);
  uStack100 = (undefined4)((ulonglong)unaff_r19 >> 0x20);
  uStack96 = (undefined4)((ulonglong)unaff_r20 >> 0x20);
  uStack92 = (undefined4)((ulonglong)unaff_r21 >> 0x20);
  uStack88 = (undefined4)((ulonglong)unaff_r22 >> 0x20);
  uStack84 = (undefined4)((ulonglong)unaff_r23 >> 0x20);
  uStack80 = (undefined4)((ulonglong)unaff_r24 >> 0x20);
  uStack76 = (undefined4)((ulonglong)unaff_r25 >> 0x20);
  uStack72 = (undefined4)((ulonglong)unaff_r26 >> 0x20);
  uStack68 = (undefined4)((ulonglong)unaff_r27 >> 0x20);
  uStack64 = (undefined4)((ulonglong)unaff_r28 >> 0x20);
  uStack60 = (undefined4)((ulonglong)unaff_r29 >> 0x20);
  uStack56 = (undefined4)((ulonglong)unaff_r30 >> 0x20);
  uStack52 = (undefined4)((ulonglong)unaff_r31 >> 0x20);
  piVar1 = (int *)ppuVar4[-0x1619];
  puVar2 = (undefined4 *)ppuVar4[-0x1ae8];
  puVar3 = ppuVar4[0x3e6];
  uVar11 = (ulonglong)*(uint *)ppuVar4[-0x1af2];
  iVar10 = *(int *)(*(int *)(iVar6 + 0xc0) + 0x14);
  dVar14 = extraout_f1;
  iVar7 = .IsContainsNameData__8LH3DMeshFv(iVar10);
  if (iVar7 == 0) {
    iVar10 = 0;
  }
  else {
    iVar7 = .GetSizeUV2Data__8LH3DMeshFv(iVar10);
    iVar8 = .GetSizeFootprintData__8LH3DMeshFv(iVar10);
    iVar10 = *(int *)(iVar10 + 0x48) + iVar8 + iVar7;
  }
  *(undefined **)puVar2 = ppuVar4[-0x1b0f];
  uStack124 = GetTickCount__7MacDozeFv();
  uStack124 = uStack124 & 0x3ff;
  local_80 = 0x43300000;
  dVar13 = (double)sin((double)(*(float *)(puVar3 + 0x44) *
                                (float)((double)CONCAT44(0x43300000,uStack124) -
                                       *(double *)(*(int *)(local_11c + 0xf90) + 0x10)) *
                               *(float *)(puVar3 + 0x48)));
  local_88 = (longlong)(int)(*(float *)(puVar3 + 0x40) * (float)dVar13 + *(float *)(puVar3 + 0x3c));
  if (param_5 != 0) {
    iVar8 = 0;
    iVar7 = 0;
    while (iVar7 < param_4) {
      iVar9 = *(int *)(iVar6 + iVar8 + 0x7c);
      countLeadingZeros(iVar7 - param_6);
      if (-1 < iVar9) {
        uVar12 = (ulonglong)*(uint *)param_7;
        iVar9 = *(int *)(iVar10 + 8) + iVar9 * 0xe0;
        local_b8 = *(float *)(iVar9 + 0x68);
        local_b4 = *(float *)(iVar9 + 0x6c);
        local_b0 = *(float *)(iVar9 + 0x70);
        local_ac = *(float *)(iVar9 + 0x74);
        local_a8 = *(float *)(iVar9 + 0x78);
        local_a4 = *(float *)(iVar9 + 0x7c);
        local_a0 = *(float *)(iVar9 + 0x80);
        local_9c = *(float *)(iVar9 + 0x84);
        local_98 = *(float *)(iVar9 + 0x88);
        local_94 = *(float *)(iVar9 + 0x8c);
        local_90 = *(float *)(iVar9 + 0x90);
        local_8c = *(float *)(iVar9 + 0x94);
        .__pl__7LHPointCFRC7LHPoint(auStack208,iVar9 + 0xd4,iVar9 + 200);
        .__ml__7LHPointCFf((double)*(float *)(puVar3 + 0x14),&local_c4,auStack208);
        dVar15 = (double)(local_bc * local_a0 + local_c0 * local_ac + local_c4 * local_b8 + local_94
                         );
        dVar16 = (double)(local_bc * local_9c + local_c0 * local_a8 + local_c4 * local_b4 + local_90
                         );
        dVar13 = (double)(local_bc * local_98 + local_c0 * local_a4 + local_c4 * local_b0 + local_8c
                         );
        NormaliseMatrixOnly__8LHMatrixFv(&local_b8);
        local_ac = -local_ac;
        local_a8 = -local_a8;
        local_94 = (float)dVar15;
        local_a4 = -local_a4;
        local_90 = (float)dVar16;
        local_8c = (float)dVar13;
        uVar5 = wcslen(uVar12);
        dVar17 = (double)(float)((double)*(float *)(puVar3 + 0x50) * dVar14);
        dVar13 = (double)GetStringWidth__13GatheringTextFPwif(dVar17,uVar11,uVar12,uVar5);
        iVar9 = *piVar1;
        dVar16 = (double)(float)((double)*(float *)(puVar3 + 0x4c) * param_2);
        dVar13 = (double)(float)(dVar16 * dVar13);
        uVar5 = wcslen(uVar12);
        dVar13 = (double)(float)(-dVar13 * (double)*(float *)(puVar3 + 0x14));
        dVar15 = (double)(float)(-dVar17 * (double)*(float *)(puVar3 + 0x14));
        DrawTextRawOriented__13GatheringTextFR8LHMatrixiiPwifffffP9LH3DColoriP9LH3DColor
                  (dVar13,(double)(float)(dVar15 - (double)(float)(dVar17 / (double)*(float *)(
                                                  puVar3 + 0x54))),(double)*(float *)(puVar3 + 0x58)
                   ,dVar17,dVar16,uVar11,&local_b8,(ulonglong)(iVar9 == 0),2,uVar12,uVar5);
        uVar5 = wcslen(uVar12);
        DrawTextRawOriented__13GatheringTextFR8LHMatrixiiPwifffffP9LH3DColoriP9LH3DColor
                  (dVar13,dVar15,(double)*(float *)(puVar3 + 0x5c),dVar17,dVar16,uVar11,&local_b8,
                   (ulonglong)(iVar9 == 0),2,uVar12,uVar5);
      }
      iVar8 = iVar8 + 4;
      param_7 = param_7 + 4;
      iVar7 = iVar7 + 1;
    }
  }
  *puVar2 = *(undefined4 *)(local_11c + -0x6c54);
  FUN_1061a8c0();
  return;
}

```